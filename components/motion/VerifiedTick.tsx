"use client";

import { motion } from "motion/react";

/**
 * The tick. One of these, everywhere something succeeds.
 *
 * It is drawn rather than faded, on a spring that is just past critical so
 * the stroke lands with weight and does not overshoot its own length — a
 * checkmark that springs past its end reads as rubber. Everything that
 * confirms in this app uses it, so a step completing, an OTP verifying and a
 * handshake landing are recognisably the same event at three sizes.
 */
const DRAW = { type: "spring", stiffness: 150, damping: 22, mass: 0.7 } as const;

export function VerifiedTick({
  on,
  size = 26,
  color = "#10b981",
  /** Stroke weight at 24px; scaled with `size` so it reads the same small. */
  weight = 2.6,
  delay = 0.14,
  className = "",
}: {
  on: boolean;
  size?: number;
  color?: string;
  weight?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <motion.path
        d="M5 12.6 10 17.6 19.4 7.4"
        stroke={color}
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={{ pathLength: { ...DRAW, delay }, opacity: { duration: 0.12 } }}
      />
    </svg>
  );
}
