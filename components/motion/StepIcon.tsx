"use client";

import { VerifiedTick } from "@/components/motion/VerifiedTick";
import { TITLE_GRADIENT } from "@/lib/gradients";

/**
 * The marker beside a step.
 *
 *   searching  a ring carrying the working spectrum, turning, with a solid
 *              black centre — the same four stops the live copy is painted in
 *   done       a green ring around a filled disc with the app's one tick
 *
 * The ring is a conic gradient masked to an annulus, because a border cannot
 * take a gradient and a bordered pseudo-element would not turn.
 */
const RING = 26;
const BORDER = 2.4;

export function StepIcon({ done, size = RING }: { done: boolean; size?: number }) {
  const inner = size - BORDER * 2;

  if (done) {
    return (
      <span
        className="relative flex shrink-0 items-center justify-center rounded-full"
        style={{ width: size, height: size, border: `${BORDER}px solid #4FB286` }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-[#4FB286]"
          style={{ width: inner - 2, height: inner - 2 }}
        >
          <VerifiedTick on size={inner * 0.62} color="#fff" weight={3.4} delay={0.04} />
        </span>
      </span>
    );
  }

  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full motion-safe:animate-[step-ring_1.6s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, #000000, #5057EA, #EF4646, #EDD758, #000000)`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${BORDER}px), #000 calc(100% - ${BORDER}px))`,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${BORDER}px), #000 calc(100% - ${BORDER}px))`,
        }}
      />
      <span
        className="rounded-full bg-black"
        style={{ width: size * 0.34, height: size * 0.34 }}
      />
    </span>
  );
}

/** Exported so the copy beside the icon is painted from the same two stops. */
export const STEP_TEXT_GRADIENT = {
  live: TITLE_GRADIENT.working,
  done: TITLE_GRADIENT.success,
};
