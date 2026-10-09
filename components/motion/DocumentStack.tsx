"use client";

import { motion } from "motion/react";

/**
 * The document stack (Figma 458:28426), carrying the Trip Vault's skeleton
 * motion.
 *
 * Three cards fading back up the pile, and inside the front one the
 * placeholder bars of a document still being read. Two rules come straight
 * from the vault's `skeleton.tsx`, and both are the difference between this
 * reading as a preview and reading as a screen that failed to load:
 *
 * ONE BAR AT A TIME. The bars are spaced a full pass apart rather than
 * staggered by a fraction of one. Staggered, the stack reads as a single
 * surface rippling; spaced, you watch a document being filled in line by
 * line, which is what the copy above it is claiming.
 *
 * THE SHIMMER RUNS ALONG EACH BAR, not across the stack. A band of light
 * crossing all three at once is a material effect, and a skeleton is not
 * made of anything — what reads is each bar lit along its own length, left
 * to right, because that is the direction text fills.
 *
 * And the rest opacity is baked into the FILL rather than set on the box.
 * With it on the container everything inside is scaled by it, so on a bar
 * sitting at 10% even a pure white streak could only ever reach 10% — the
 * chase runs correctly and is invisible.
 */

/** One bar's pass. Ambient, not a progress indicator — nothing is pending. */
const SHINE_S = 1.05;
/** Dead air between one finishing and the next, or the chase is a ripple. */
const GAP_S = 0.3;
const BARS = 3;
const CYCLE_S = BARS * (SHINE_S + GAP_S);

const shine = (index: number) => ({
  duration: SHINE_S,
  delay: index * (SHINE_S + GAP_S),
  repeat: Infinity,
  repeatDelay: CYCLE_S - SHINE_S,
  ease: "easeInOut" as const,
});

/** A specular streak, not a wipe: narrow and angled off vertical, so it
 *  reads as light catching the bar rather than a shutter passing over it. */
const STREAK = "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.75) 50%, transparent 100%)";
const STREAK_W = 0.48;

/** The bars' fill, from the node. Alpha is folded in, not set on the box. */
const BAR_FILL =
  "linear-gradient(90deg, rgba(77,98,106,0.30) 0.93%, rgba(131,141,151,0.30) 26.73%, rgba(179,194,192,0.30) 80.78%, rgba(221,229,227,0.30) 100.51%)";

export const STACK_W = 353;
export const STACK_H = 104;

function Bar({ x, y, w, index }: { x: number; y: number; w: number; index: number }) {
  return (
    <div
      className="absolute overflow-hidden"
      style={{ left: x, top: y, width: w, height: 10, borderRadius: 6.785, background: BAR_FILL }}
    >
      <motion.div
        className="absolute inset-y-0"
        style={{ width: `${STREAK_W * 100}%`, background: STREAK }}
        initial={{ x: "-120%" }}
        animate={{ x: "260%" }}
        transition={shine(index)}
      />
    </div>
  );
}

export function DocumentStack({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: STACK_W, height: STACK_H }} aria-hidden>
      {/* the two behind, fading back up the pile */}
      <div
        className="absolute"
        style={{
          left: 31, top: 0, width: 292, height: 71.608, borderRadius: 15.913,
          background: "rgba(213,255,254,0.1)",
          boxShadow: "0 3.183px 22.278px -1.528px rgba(0,0,0,0.07)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: 7, top: 7.64, width: 340, height: 83.379, borderRadius: 18.529,
          background: "rgba(213,255,254,0.1)",
          boxShadow: "0 3.706px 25.94px -1.779px rgba(0,0,0,0.07)",
        }}
      />

      {/* the one you are reading */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: 0, top: 16.17, width: 353, height: 88, borderRadius: 20,
          background: "rgba(255,255,255,0.55)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
        }}
      >
        {/* the wash the node puts behind the bars */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(118deg, rgba(255,255,255,0.9) 0%, rgba(226,246,255,0.75) 46%, rgba(214,255,252,0.55) 100%)",
          }}
        />
        <Bar x={18} y={22} w={143} index={0} />
        <Bar x={18} y={38} w={103} index={1} />
        <div className="absolute" style={{ left: 16, top: 65, width: 321, height: 10 }}>
          <Bar x={0} y={0} w={321} index={2} />
          {/* the nub the node leaves at the head of the last line */}
          <span
            className="absolute rounded-full"
            style={{ left: 2, top: 2.5, width: 14, height: 5, background: "#52b9f0" }}
          />
        </div>
      </div>
    </div>
  );
}
