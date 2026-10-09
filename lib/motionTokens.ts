/**
 * Easing and blur tokens from the onboarding prototype
 * (`shared/motion.ts` in the Motion Library).
 *
 * The thing that makes that text feel smooth is not the curve on its own —
 * it is that copy arrives out of a BLUR rather than out of nothing, over a
 * long decelerating ease, with only a small amount of travel. Opacity alone
 * reads as a switch; blur reads as something coming into focus.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.7, 0, 0.84, 0] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** How far out of focus copy starts, in px. */
export const BLUR_PEAK = 10;

/** Per-word reveal, for copy that lands a line at a time. */
export const WORD_STAGGER_MS = 60;
export const WORD_DURATION_MS = 320;
