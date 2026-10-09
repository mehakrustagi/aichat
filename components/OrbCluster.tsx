"use client";

import { useEffect, useRef } from "react";
import { ORBS } from "@/lib/orbs";
import { ORB_FRAG, ORB_VERT, SHELL_FRAG, SHELL_VERT } from "@/lib/orbShader";
import { ORB_GLASS_DEFAULTS, hexToRgb, type OrbGlass } from "@/lib/orbGlass";
import type { MotionRef } from "@/hooks/useDeviceMotion";

/**
 * Everything worth tweaking when we refine the feel together.
 *
 * Motion: the orbs are masses on springs that the phone's own acceleration
 * throws around, and they shove each other apart on contact.
 *
 * Glass: see lib/orbShader.ts. The art supplies the contents; the shader
 * supplies the sphere.
 */
/** Fixed shape of the cluster. Everything tunable lives in lib/orbGlass.ts
 *  and is driven live from the bench at /orbs. */
export const ORB_TUNING = {
  /** how much the small/far orbs still travel: 0 = not at all, 1 = like the front */
  parallaxBackFloor: 0.42,
  /** idle float speed (phase units per second) */
  baseRate: 0.5,
  /** heavier (bigger) orbs get a softer spring, so the cluster never moves as one */
  massFromSize: 0.55,
  /** stiffness of the soft wall at the edge of the roam radius */
  roamWall: 110,
  squeeze: 0.94,
  contact: 0.86,
  /** Where the light sits with the phone level. The art is painted lit from
   *  the upper left, so the room starts there and tilt turns it from there. */
  restLight: [-0.42, -0.58] as const,
  /** how far the gyro swings the room around */
  lightSwing: 0.85,
} as const;

/** How far an orb is held up while it waits for its digit. */
const LIFT_PX = 120;

/** The largest orb, used to normalise mass. */
const MAX_SIZE = Math.max(...ORBS.map((o) => o.size));

/**
 * How close any two orbs may get before they push back.
 *
 * The Figma cluster already overlaps heavily, and that overlap IS the
 * design — so a pair's own resting distance is its baseline, and it may
 * squeeze a little past it before resisting. Pairs that start far apart
 * fall back to actual contact instead, or they'd repel across the screen.
 */
const MIN_DIST: number[][] = ORBS.map((a) =>
  ORBS.map((b) => {
    if (a === b) return 0;
    const rest = Math.hypot(b.cx - a.cx, b.cy - a.cy);
    const touch = ((a.size + b.size) / 2) * ORB_TUNING.contact;
    return Math.min(rest * ORB_TUNING.squeeze, touch);
  }),
);

/** The canvas covers the cluster and the brand mark below it, in both the
 *  resting and the keyboard-raised layouts. */
export const ORB_CANVAS_HEIGHT = 470;
const DESIGN_WIDTH = 440;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile failed");
  }
  return sh;
}

type Props = {
  motion: MotionRef;
  className?: string;
  /** shifts every orb up when the keyboard raises the layout */
  offsetY?: number;
  /** live overrides from the bench at /orbs */
  glass?: OrbGlass;
  /** 0 = the full thirteen in their Figma layout, 1 = the five that regroup
   *  once the keyboard is up. Anything between is the transition. */
  focus?: number;
  /** True once the field is live: the cluster rises and waits. */
  lifted?: boolean;
  /** How many digits are in. Each one drops the next orb back down. */
  typed?: number;
  /** How many digits this field wants — ten for the number, six for the OTP.
   *  Orbs past this take no part in the round. */
  slots?: number;
};

export function OrbCluster({
  motion,
  className,
  offsetY = 0,
  glass,
  focus = 0,
  lifted = false,
  typed = 0,
  slots = 10,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read inside the frame loop rather than re-creating the GL context on
  // every slider nudge.
  const liveRef = useRef({ offsetY, glass: glass ?? ORB_GLASS_DEFAULTS, focus, lifted, typed, slots });
  useEffect(() => {
    liveRef.current = { offsetY, glass: glass ?? ORB_GLASS_DEFAULTS, focus, lifted, typed, slots };
  }, [offsetY, glass, focus, lifted, typed, slots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) return;

    const T = ORB_TUNING;
    const n = ORBS.length;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- program ------------------------------------------------------
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, ORB_VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, ORB_FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) ?? "link failed");
    }
    gl.useProgram(prog);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uResolution = u("u_resolution");
    const uCenter = u("u_center");
    const uSize = u("u_size");
    const uLight = u("u_light");
    const uPx = u("u_px");
    const uAlpha = u("u_alpha");

    gl.uniform1i(u("u_tex"), 0);

    // Every glass knob, re-sent each frame so the bench is live.
    const G = {
      centreZoom: u("u_centreZoom"), edgeBend: u("u_edgeBend"),
      chromatic: u("u_chromatic"), rimHaze: u("u_rimHaze"),
      rimLine: u("u_rimLine"), highlight: u("u_highlight"),
      gloss: u("u_gloss"), glossDual: u("u_glossDual"),
      glossSize: u("u_glossSize"), tint: u("u_tint"),
      parallax: u("u_parallax"), physicalOn: u("u_physicalOn"),
      ior: u("u_ior"), wallThickness: u("u_wallThickness"),
      imageDepth: u("u_imageDepth"), glassTint: u("u_glassTint"),
      reflections: u("u_reflections"), solidOn: u("u_solidOn"),
      rimColourDepth: u("u_rimColourDepth"),
      innerReflections: u("u_innerReflections"),
      highlights: u("u_highlights"), innerGlow: u("u_innerGlow"),
    };

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // --- the painted shell, a second pass over each body --------------
    const shellProg = gl.createProgram()!;
    gl.attachShader(shellProg, compile(gl, gl.VERTEX_SHADER, SHELL_VERT));
    gl.attachShader(shellProg, compile(gl, gl.FRAGMENT_SHADER, SHELL_FRAG));
    gl.linkProgram(shellProg);
    const sPos = gl.getAttribLocation(shellProg, "a_pos");
    const sResolution = gl.getUniformLocation(shellProg, "u_resolution");
    const sRect = gl.getUniformLocation(shellProg, "u_rect");
    const sAlpha = gl.getUniformLocation(shellProg, "u_alpha");
    gl.useProgram(shellProg);
    gl.uniform1i(gl.getUniformLocation(shellProg, "u_tex"), 0);
    gl.useProgram(prog);

    // --- textures, one per distinct piece of art ----------------------
    const textures = new Map<string, WebGLTexture>();
    let disposed = false;
    for (const src of new Set([...ORBS.map((o) => o.src), ...ORBS.map((o) => o.shell)])) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // 1px placeholder so the first frames draw something sane
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      textures.set(src, tex);

      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.onload = () => {
        if (disposed) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    }

    // --- simulation ----------------------------------------------------
    const sim = ORBS.map(() => ({
      x: 0, y: 0, vx: 0, vy: 0, fx: 0, fy: 0, phase: 0, tx: 0, ty: 0,
    }));
    const invMass = ORBS.map((o) => (MAX_SIZE * MAX_SIZE) / (o.size * o.size));
    const home = ORBS.map((o) => ({ cx: o.cx, cy: o.cy, size: o.size, alpha: 1 }));

    /* The orbs that take part in the count, left to right across the
       regrouped cluster, so they drop in the order you read them. */
    const dropOrder = ORBS.map((o, i) => ({ o, i }))
      .filter(({ o }) => o.focus && !o.anchored)
      .sort((a, b) => a.o.focus!.cx - b.o.focus!.cx)
      .map(({ i }) => i);
    const rank = ORBS.map(() => -1);
    dropOrder.forEach((orbIndex, r) => (rank[orbIndex] = r));
    /** eased 0..1 per orb: 1 is held up, 0 is back where it belongs */
    const liftT = ORBS.map(() => 0);
    // back to front, so the paint order Figma chose survives
    const order = ORBS.map((_, i) => i).sort((a, b) => ORBS[a].z - ORBS[b].z);

    let raf = 0;
    let last = performance.now();
    let dpr = 0;
    let focusT = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    /* Frame cost, smoothed. The shader does four texture reads per pixel for
       the chromatic split alone, and at DPR 3 on a tall handset that is close
       to two million pixels a frame — enough to drop below 60 and make the
       tilt read as stuttering rather than as a slow sensor. When frames run
       long we render fewer pixels; the canvas is scaled to fit either way, so
       the only visible cost is a little softness. */
    let frameMs = 16.7;
    let budget = 3;

    const resize = () => {
      const next = Math.min(window.devicePixelRatio || 1, budget);
      if (Math.abs(next - dpr) < 0.01) return;
      dpr = next;
      canvas.width = Math.round(DESIGN_WIDTH * dpr);
      canvas.height = Math.round(ORB_CANVAS_HEIGHT * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(shellProg);
      gl.uniform2f(sResolution, DESIGN_WIDTH, ORB_CANVAS_HEIGHT);
      gl.useProgram(prog);
      gl.uniform2f(uResolution, DESIGN_WIDTH, ORB_CANVAS_HEIGHT);
    };

    const tick = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't fling the springs apart.
      const raw = now - last;
      const dt = Math.min(raw / 1000, 1 / 30);
      last = now;

      frameMs += (raw - frameMs) * 0.05;
      if (frameMs > 22 && budget > 1.5) budget = Math.max(1.5, budget - 0.25);
      else if (frameMs < 14 && budget < 3) budget = Math.min(3, budget + 0.05);
      resize();

      const { tiltX, tiltY, shake, accelX, accelY } = motion.current;
      const { offsetY: shiftY, glass: g, focus: focusTarget, lifted, typed, slots } = liveRef.current;
      // Ease toward the target rather than snapping, so the regroup reads as
      // the orbs swimming into place instead of a cut.
      focusT += (focusTarget - focusT) * Math.min(1, dt * 4.5);
      const rate = T.baseRate * g.float + shake * g.shakeSpeed;
      const ampK = (1 + shake * g.shakeAmount) * g.float;

      // Where each orb calls home this frame, and how big it is there.
      for (let i = 0; i < n; i++) {
        const orb = ORBS[i];
        const h = home[i];
        if (orb.focus) {
          h.cx = lerp(orb.cx, orb.focus.cx, focusT);
          h.cy = lerp(orb.cy, orb.focus.cy, focusT);
          h.size = lerp(orb.size, orb.focus.size, focusT);
          h.alpha = 1;
        } else {
          h.cx = orb.cx;
          h.cy = orb.cy;
          h.size = orb.size;
          // the ones not in the regrouped cluster step aside
          h.alpha = 1 - focusT;
        }
        const r = rank[i];
        // An orb on its way up fades as it goes, so it leaves nothing behind
        // — squared, so it stays solid for most of the travel and only thins
        // out at the end. Orbs past this round's slots never appear at all.
        if (r >= 0) {
          h.alpha *= 1 - liftT[i] * liftT[i];
          if (r >= liveRef.current.slots) h.alpha *= 1 - focusT;
        }
      }

      // --- pass 1: targets and forces ---------------------------------
      for (let i = 0; i < n; i++) {
        const orb = ORBS[i];
        const s = sim[i];
        if (!reduced) s.phase += dt * rate * orb.tempo;

        const depth = T.parallaxBackFloor + (1 - T.parallaxBackFloor) * orb.depth;
        const lead = orb.anchored ? 0.25 : 1;

        const floatX = Math.sin(s.phase * orb.drift.fx + orb.drift.px) * orb.drift.ax * ampK;
        const floatY = Math.cos(s.phase * orb.drift.fy + orb.drift.py) * orb.drift.ay * ampK;

        /* The count. Focusing the field lifts every orb; each digit lets the
           next one back down. It rides the same spring as everything else, so
           an orb arriving looks like an orb, not like a value changing. */
        const r = rank[i];
        const inRound = r >= 0 && r < slots;
        const want = lifted && inRound && r >= typed ? 1 : 0;
        liftT[i] += (want - liftT[i]) * Math.min(1, dt * 6);

        s.tx = floatX + tiltX * g.tiltTravel * depth * lead;
        s.ty = floatY + tiltY * g.tiltTravel * depth * lead - liftT[i] * LIFT_PX;

        const mass = 1 + (orb.depth - 0.5) * T.massFromSize;
        s.fx = ((s.tx - s.x) * g.spring) / mass - s.vx * g.drag;
        s.fy = ((s.ty - s.y) * g.spring) / mass - s.vy * g.drag;
        s.fx += (accelX * g.throwForce * lead) / mass;
        s.fy += (accelY * g.throwForce * lead) / mass;

        const dx = s.x - s.tx;
        const dy = s.y - s.ty;
        const d = Math.hypot(dx, dy);
        if (d > g.roam) {
          const over = (d - g.roam) / g.roam;
          s.fx -= (dx / d) * over * T.roamWall;
          s.fy -= (dy / d) * over * T.roamWall;
        }
      }

      // --- pass 2: they shove each other apart ------------------------
      for (let i = 0; i < n; i++) {
        if (ORBS[i].anchored) continue;
        for (let j = i + 1; j < n; j++) {
          if (ORBS[j].anchored) continue;
          const sa = sim[i];
          const sb = sim[j];
          const dx = home[j].cx + sb.x - (home[i].cx + sa.x);
          const dy = home[j].cy + sb.y - (home[i].cy + sa.y);
          const d = Math.hypot(dx, dy) || 0.0001;
          // While regrouped the cluster is looser, so contact is measured
          // off the live sizes rather than the Figma spacing.
          const min =
            focusT > 0.02
              ? lerp(MIN_DIST[i][j], ((home[i].size + home[j].size) / 2) * T.contact, focusT)
              : MIN_DIST[i][j];
          if (d >= min) continue;
          const push = ((min - d) / min) * g.repel;
          const nx = dx / d;
          const ny = dy / d;
          sa.fx -= nx * push * invMass[i];
          sa.fy -= ny * push * invMass[i];
          sb.fx += nx * push * invMass[j];
          sb.fy += ny * push * invMass[j];
        }
      }

      // --- pass 3: integrate and draw ---------------------------------
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // The light is fixed in the world; turning the phone turns the room.
      gl.uniform2f(
        uLight,
        T.restLight[0] - tiltX * T.lightSwing,
        T.restLight[1] - tiltY * T.lightSwing,
      );

      gl.uniform1f(G.centreZoom, g.centreZoom);
      gl.uniform1f(G.edgeBend, g.edgeBend);
      gl.uniform1f(G.chromatic, g.chromatic);
      gl.uniform1f(G.rimHaze, g.rimHaze);
      gl.uniform1f(G.rimLine, g.rimLine);
      gl.uniform1f(G.highlight, g.highlight);
      gl.uniform1f(G.gloss, g.gloss);
      gl.uniform1f(G.glossDual, g.glossShape === "dual" ? 1 : 0);
      gl.uniform1f(G.glossSize, g.glossSize);
      gl.uniform3fv(G.tint, hexToRgb(g.tint));
      gl.uniform1f(G.parallax, g.parallax);
      gl.uniform1f(G.physicalOn, g.physicalOn ? 1 : 0);
      gl.uniform1f(G.ior, g.ior);
      gl.uniform1f(G.wallThickness, g.wallThickness);
      gl.uniform1f(G.imageDepth, g.imageDepth);
      gl.uniform1f(G.glassTint, g.glassTint);
      gl.uniform1f(G.reflections, g.reflections);
      gl.uniform1f(G.solidOn, g.solidOn ? 1 : 0);
      gl.uniform1f(G.rimColourDepth, g.rimColourDepth);
      gl.uniform1f(G.innerReflections, g.innerReflections);
      gl.uniform1f(G.highlights, g.highlights);
      gl.uniform1f(G.innerGlow, g.innerGlow);

      for (const i of order) {
        const orb = ORBS[i];
        const s = sim[i];
        s.vx += s.fx * dt;
        s.vy += s.fy * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const h = home[i];
        if (h.alpha <= 0.002) continue;
        const tex = textures.get(orb.src);
        if (!tex) continue;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform2f(uCenter, h.cx + s.x, h.cy + s.y + shiftY);
        gl.uniform1f(uSize, h.size);
        gl.uniform1f(uPx, 1 / (h.size * dpr));
        gl.uniform1f(uAlpha, h.alpha);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        const shellTex = textures.get(orb.shell);
        if (shellTex && g.shellOpacity > 0.002) {
          const box = orb.shellBox;
          gl.useProgram(shellProg);
          gl.enableVertexAttribArray(sPos);
          gl.vertexAttribPointer(sPos, 2, gl.FLOAT, false, 0, 0);
          gl.bindTexture(gl.TEXTURE_2D, shellTex);
          gl.uniform4f(
            sRect,
            h.cx + s.x - h.size / 2 + box.left * h.size,
            h.cy + s.y + shiftY - h.size / 2 + box.top * h.size,
            box.width * h.size,
            box.height * h.size,
          );
          gl.uniform1f(sAlpha, h.alpha * g.shellOpacity);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          gl.useProgram(prog);
          gl.enableVertexAttribArray(aPos);
          gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(quad);
      gl.deleteProgram(prog);
      gl.deleteProgram(shellProg);
    };
  }, [motion]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ width: DESIGN_WIDTH, height: ORB_CANVAS_HEIGHT }}
    />
  );
}
