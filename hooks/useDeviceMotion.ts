"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MotionPermission = "unsupported" | "prompt" | "granted" | "denied";

export type MotionState = {
  /** -1..1 — phone tilted left / right (gamma) */
  tiltX: number;
  /** -1..1 — phone tilted back / forward (beta) */
  tiltY: number;
  /** 0..1 — how vigorously the phone is being moved right now */
  shake: number;
  /** Linear acceleration in SCREEN space, m/s², gravity removed.
   *  +x is to the right, +y is down. This is what actually throws the
   *  orbs around — `shake` only says how fast they should be swimming. */
  accelX: number;
  accelY: number;
};

export type MotionRef = { readonly current: MotionState };

type WithPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Tilt (deg) that maps to a full-strength offset. 35 to match the Motion
 *  Library's comet-card — past that a phone is being waved, not tilted. */
const TILT_RANGE_DEG = 31.5;
/** phones are usually held tipped back; treat this beta as level */
const NEUTRAL_BETA = 45;
/** Time constant for the tilt low-pass, in seconds.
 *
 *  This used to be a flat per-frame lerp, which is a bug on a phone: the
 *  same constant settles twice as fast at 120Hz as at 60Hz, and on a device
 *  whose frame rate swings (which is every device under load) the response
 *  changes with it. Expressed as a time constant and applied against dt, the
 *  feel is the same whatever the display is doing. */
const TILT_TAU = 0.075;
/** Sensor noise floor, in the same -1..1 the tilt is expressed in. Below this
 *  the reading is held, so a phone resting on a table does not shimmer. */
const TILT_DEADZONE = 0.004;

/** How fast the gravity estimate tracks. Low, so only the slow component
 *  (which IS gravity) is subtracted and real motion survives. */
const GRAVITY_TRACK = 0.08;
/** linear acceleration (m/s²) that counts as a full-strength shake */
const SHAKE_FULL_SCALE = 14;
/** shake rises fast so the orbs answer the first jolt... */
const SHAKE_ATTACK = 22;
/** ...and falls quickly, so the speed tracks the rhythm of the shaking
 *  rather than smearing into one long blur. */
const SHAKE_RELEASE = 4.2;
/** acceleration decays toward zero between sensor events */
const ACCEL_RELEASE = 7;

/** if no sensor event lands by now, fall back to the pointer (desktop) */
const SENSOR_GRACE_MS = 1200;

export function useDeviceMotion() {
  const [permission, setPermission] = useState<MotionPermission>("prompt");
  const [active, setActive] = useState(false);
  const [usingPointer, setUsingPointer] = useState(false);

  const motion = useRef<MotionState>({
    tiltX: 0,
    tiltY: 0,
    shake: 0,
    accelX: 0,
    accelY: 0,
  });
  const target = useRef({ x: 0, y: 0 });
  const sawSensor = useRef(false);
  /** running estimate of which way is down, so we can subtract it */
  const gravity = useRef<{ x: number; y: number; z: number } | null>(null);
  /** latest linear acceleration, in screen space */
  const impulse = useRef({ x: 0, y: 0, mag: 0 });

  // Sensor support can only be probed in the browser, so this has to land after
  // mount — the server has no idea which of the three states applies.
  useEffect(() => {
    const supported = "DeviceOrientationEvent" in window;
    const needsGesture =
      supported &&
      typeof (DeviceOrientationEvent as unknown as WithPermission).requestPermission ===
        "function";

    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-mount capability probe
    setPermission(!supported ? "unsupported" : needsGesture ? "prompt" : "granted");
    // Android and desktop don't gate sensors behind a user gesture.
    setActive(supported && !needsGesture);
  }, []);

  /**
   * iOS 13+ only hands over the sensors from inside a user gesture.
   *
   * The Motion Library's comet-card waits for the first tap anywhere rather
   * than putting a button on screen, which is the better trade: the screen
   * stays as designed and the permission arrives the moment someone touches
   * it — which on a sign-in screen they are about to do anyway.
   */
  const request = useCallback(async () => {
    const orientation = DeviceOrientationEvent as unknown as WithPermission;
    const deviceMotion =
      typeof DeviceMotionEvent !== "undefined"
        ? (DeviceMotionEvent as unknown as WithPermission)
        : undefined;
    try {
      const results: string[] = [];
      if (typeof orientation.requestPermission === "function") {
        results.push(await orientation.requestPermission());
      }
      if (typeof deviceMotion?.requestPermission === "function") {
        results.push(await deviceMotion.requestPermission());
      }
      const granted = results.length === 0 || results.every((r) => r === "granted");
      setPermission(granted ? "granted" : "denied");
      setActive(granted);
      return granted;
    } catch {
      setPermission("denied");
      return false;
    }
  }, []);

  // The gesture that unlocks iOS. One shot, anywhere on the page.
  useEffect(() => {
    if (permission !== "prompt") return;
    const onGesture = () => {
      void request();
      window.removeEventListener("pointerdown", onGesture);
    };
    window.addEventListener("pointerdown", onGesture);
    return () => window.removeEventListener("pointerdown", onGesture);
  }, [permission, request]);

  // Sensors
  useEffect(() => {
    if (!active) return;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null && e.beta == null) return;
      sawSensor.current = true;
      target.current.x = clamp((e.gamma ?? 0) / TILT_RANGE_DEG, -1, 1);
      target.current.y = clamp(((e.beta ?? NEUTRAL_BETA) - NEUTRAL_BETA) / TILT_RANGE_DEG, -1, 1);
    };

    const onMotion = (e: DeviceMotionEvent) => {
      // `acceleration` is already gravity-free where it exists, but plenty
      // of devices only populate the "including gravity" reading, so we
      // high-pass that instead and use whichever we end up with.
      let ax: number | null = null;
      let ay: number | null = null;

      const linear = e.acceleration;
      if (linear && linear.x != null && linear.y != null) {
        ax = linear.x;
        ay = linear.y;
      } else {
        const g = e.accelerationIncludingGravity;
        if (!g || g.x == null || g.y == null || g.z == null) return;
        const prev = gravity.current ?? { x: g.x, y: g.y, z: g.z };
        const next = {
          x: prev.x + (g.x - prev.x) * GRAVITY_TRACK,
          y: prev.y + (g.y - prev.y) * GRAVITY_TRACK,
          z: prev.z + (g.z - prev.z) * GRAVITY_TRACK,
        };
        gravity.current = next;
        ax = g.x - next.x;
        ay = g.y - next.y;
      }

      sawSensor.current = true;
      // Device y points up the screen; ours points down.
      impulse.current.x = ax;
      impulse.current.y = -ay;
      impulse.current.mag = Math.hypot(ax, ay);
    };

    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("devicemotion", onMotion);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [active]);

  // Desktop fallback: drive tilt from the pointer so the effect is testable.
  useEffect(() => {
    // Only on devices that have a real pointer — a phone waiting on the iOS
    // permission prompt must keep showing the prompt, not silently fall back.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let detach: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      if (sawSensor.current) return;
      setUsingPointer(true);
      let last: { x: number; y: number; t: number } | null = null;
      const onPointer = (e: PointerEvent) => {
        target.current.x = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
        target.current.y = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);

        // Stand in for the accelerometer: flinging the cursor should fling
        // the orbs, so the physics can be judged without a phone.
        const now = performance.now();
        if (last) {
          const dt = Math.max(16, now - last.t) / 1000;
          const vx = (e.clientX - last.x) / dt / 40;
          const vy = (e.clientY - last.y) / dt / 40;
          impulse.current.x = vx;
          impulse.current.y = vy;
          impulse.current.mag = Math.hypot(vx, vy);
        }
        last = { x: e.clientX, y: e.clientY, t: now };
      };
      window.addEventListener("pointermove", onPointer);
      detach = () => window.removeEventListener("pointermove", onPointer);
    }, SENSOR_GRACE_MS);

    return () => {
      window.clearTimeout(timer);
      detach?.();
    };
  }, []);

  // Smoothing, attack and decay. Runs always so `motion.current` stays
  // continuous between sensor events, which fire irregularly.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const m = motion.current;

      // Frame-rate independent: the fraction of the remaining gap closed in
      // dt, rather than a fixed fraction per frame.
      const ease = 1 - Math.exp(-dt / TILT_TAU);
      if (Math.abs(target.current.x - m.tiltX) > TILT_DEADZONE) m.tiltX += (target.current.x - m.tiltX) * ease;
      if (Math.abs(target.current.y - m.tiltY) > TILT_DEADZONE) m.tiltY += (target.current.y - m.tiltY) * ease;

      // Fast up, slower down: the orbs jump the moment you move the phone
      // and keep swimming for a beat after you stop.
      const want = clamp(impulse.current.mag / SHAKE_FULL_SCALE, 0, 1);
      const k = want > m.shake ? SHAKE_ATTACK : SHAKE_RELEASE;
      m.shake += (want - m.shake) * Math.min(1, k * dt);

      m.accelX = impulse.current.x;
      m.accelY = impulse.current.y;

      // Bleed the reading away between events so a device that stops
      // reporting doesn't leave the orbs under constant thrust.
      const bleed = Math.max(0, 1 - ACCEL_RELEASE * dt);
      impulse.current.x *= bleed;
      impulse.current.y *= bleed;
      impulse.current.mag *= bleed;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Kept for the benches, which want an explicit control. The screen itself
   *  no longer shows one — the first tap does it. */
  const needsPermission = permission === "prompt" && !usingPointer;

  return { motion: motion as MotionRef, permission, needsPermission, request };
}
