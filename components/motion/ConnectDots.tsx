"use client";

import { motion } from "motion/react";

/**
 * The link between the two apps.
 *
 * Five dots, largest in the middle and tapering to either end, so the row
 * reads as a connection with a centre rather than as a row of equal beads.
 * A pulse travels left to right — from us, to them — brightening and
 * swelling each dot as it passes. The middle one keeps its size throughout;
 * it is the thing being travelled through, not part of the travelling.
 */
const DOTS = [6, 10, 16, 10, 6];
const GAP = 8;
/** One pass end to end. Slow enough to read as a handshake, not a spinner. */
const SWEEP_S = 1.5;
/** Dead air before it sets off again, so passes read as separate. */
const REST_S = 0.45;

export function ConnectDots({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`} style={{ gap: GAP }} aria-hidden>
      {DOTS.map((size, i) => (
        <motion.span
          key={i}
          className="rounded-full bg-[#ececec]"
          style={{ width: size, height: size }}
          animate={{
            scale: [1, 1.28, 1],
            backgroundColor: ["#ececec", "#c9cdd4", "#ececec"],
          }}
          transition={{
            duration: SWEEP_S * 0.5,
            // Left to right: each dot picks it up after the one before it.
            delay: (i / DOTS.length) * SWEEP_S,
            repeat: Infinity,
            repeatDelay: SWEEP_S + REST_S - SWEEP_S * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
