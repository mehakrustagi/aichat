/**
 * Haptic feedback. `navigator.vibrate` works on Android Chrome and PWAs and
 * silently does nothing on iOS Safari and desktop, which is the right
 * fallback — it never throws and never blocks.
 */
const PATTERNS = {
  /** a key on the number pad */
  key: 8,
  /** the delete key — a shade heavier, so it reads as different */
  erase: 12,
  /** a CTA committing */
  commit: [14, 40, 20],
  /** one OTP box filling */
  otpFill: 6,
  /** the six boxes merging into one */
  otpMerge: [10, 30, 18],
  /** verified */
  success: [18, 50, 26, 50, 40],
} as const;

export type HapticTrigger = keyof typeof PATTERNS;

export function haptic(trigger: HapticTrigger) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[trigger] as number | number[]);
  } catch {
    // Some browsers throw when called too often or outside a gesture.
  }
}
