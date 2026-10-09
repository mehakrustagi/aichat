"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";

/**
 * The atlys pill, with the tap behaviour from the Motion Library's
 * native-ai-button: strike the surface and the colour parts where your finger
 * lands, then closes back over it.
 *
 * Our pill carries its colour as one painted asset rather than five animated
 * blobs, so the split is applied to the two stacked copies the design already
 * uses — each one thrown away from the tap, pinched across its travel and
 * brightened by the same force that throws it.
 */

/**
 * Halves a spring's speed while leaving its character alone.
 *
 * A spring's frequency goes as √(k/m), so quartering the stiffness halves the
 * speed. Damping has to come down with √k or the damping ratio
 * ζ = c / 2√(km) rises and the slack rejoin stops wobbling — which is the
 * whole effect. So stiffness falls by the square of the factor and damping by
 * the factor itself, and the motion is the same shape, half as fast.
 */
const slower = <T extends { stiffness: number; damping: number }>(spring: T, factor: number): T => ({
  ...spring,
  stiffness: spring.stiffness / factor ** 2,
  damping: spring.damping / factor,
});

const PART_SLOW = 2;

/** Out: fast and sharp — the surface is struck, not eased.
 *  Back: slack and underdamped, so the two halves slap together and wobble
 *  before they settle. The asymmetry is the whole effect. */
const PART_SPRING = slower({ type: "spring" as const, stiffness: 520, damping: 26, mass: 0.7 }, PART_SLOW);
const REJOIN_SPRING = slower({ type: "spring" as const, stiffness: 95, damping: 12, mass: 1.2 }, PART_SLOW);

/** How long the halves stay apart before the colour closes back over. */
const HOLD_MS = 200 * PART_SLOW;

/**
 * How long before the tap's actual consequence lands.
 *
 * The split is feedback for a press, and firing the action on pointerdown
 * put a sheet over it before any of it could be seen. The library's own
 * ConfirmButton makes the same point: the payoff must not arrive before the
 * button has finished. This is roughly where the outward spring peaks.
 */
const ACT_AT_MS = 200;

/** Where each stacked copy sits, as a fraction of the pill's width. */
const COPY_CENTRES = [0.3, 0.7];

function split(centre: number, burst: number, width: number) {
  const delta = centre - burst;
  const side = delta === 0 ? 1 : Math.sign(delta);
  const proximity = Math.max(0, 1 - Math.abs(delta) / 0.85);
  const force = 0.35 + 0.65 * proximity;
  return {
    x: side * width * 0.34 * force,
    y: -6 * proximity * side,
    scaleX: 1 - 0.42 * proximity,
    scaleY: 1 + 0.5 * proximity,
    // Saturate rather than brightness: these are solid fills, and pushing
    // luminance alone walks them toward white exactly when the colour should
    // be at its most intense.
    filter: `saturate(${(1 + 0.85 * force).toFixed(3)}) brightness(${(1 + 0.16 * force).toFixed(3)})`,
  };
}

const REST = { x: 0, y: 0, scaleX: 1, scaleY: 1, filter: "saturate(1) brightness(1)" };

export function LiquidPill({
  children,
  onTap,
  width = 340,
  height = 50,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  onTap?: () => void;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [burst, setBurst] = useState<number | null>(null);
  const parting = burst !== null;

  const strike = (e: React.PointerEvent<HTMLButtonElement>) => {
    const box = ref.current?.getBoundingClientRect();
    // Measured off the real element: tapping the left end has to part the
    // colour at the left end, not in the middle.
    const fraction = box ? (e.clientX - box.left) / box.width : 0.5;
    setBurst(Math.min(1, Math.max(0, fraction)));
    haptic("commit");
    window.setTimeout(() => setBurst(null), HOLD_MS);
    window.setTimeout(() => onTap?.(), ACT_AT_MS);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      onPointerDown={strike}
      animate={parting ? { scale: 0.975 } : { scale: 1 }}
      transition={parting ? PART_SPRING : REJOIN_SPRING}
      style={{ width, height, WebkitTapHighlightColor: "transparent" }}
      className={`relative shrink-0 overflow-hidden rounded-[84px] ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[84px]">
        {COPY_CENTRES.map((centre, i) => (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: 2.41, top: -64.64, width: 371.659, height: 179.296 }}
            animate={parting ? split(centre, burst, width) : REST}
            transition={parting ? PART_SPRING : REJOIN_SPRING}
          >
            <Image
              src="/icons/pill-gradient.svg"
              alt=""
              width={371.659}
              height={179.296}
              style={{ width: 371.659, height: 179.296 }}
              className="max-w-none animate-[pill-drift_14s_ease-in-out_infinite]"
            />
          </motion.span>
        ))}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-[84px] bg-white/10" />
      {/* Fills the button rather than wrapping the text inline: as an inline
          span it became the containing block for any absolutely-positioned
          child, and the atlys label resolved against a zero-sized box and
          escaped the pill. */}
      <span className="relative flex h-full w-full items-center justify-center">{children}</span>
    </motion.button>
  );
}
