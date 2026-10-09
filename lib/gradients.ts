/**
 * Text gradients, from the Motion Library's reservation-agent
 * (`src/registry/entries/snapmap/lib/states.ts`).
 *
 * `working` is the same four stops Figma gives "Hermes" on the sign-in
 * screen — ink, blue, red, yellow — which is how we know it's a house token
 * and not a one-off.
 */
export const TITLE_GRADIENT = {
  /** Default "agent is working" spectrum: ink → blue → red → yellow. */
  working: "linear-gradient(90deg, #000000 0%, #5057EA 33%, #EF4646 66%, #EDD758 99%)",
  /** Resolved / success: ink → emerald. */
  success: "linear-gradient(90deg, #0B0B0B 0%, #10B981 100%)",
  /** Neutral grey, for the muted states. */
  muted: "linear-gradient(90deg, #9A9A9A 0%, #C6C6C6 100%)",
  /** Plain ink, for when the drum is carrying ordinary copy. */
  ink: "linear-gradient(90deg, #1A1A1A 0%, #1A1A1A 100%)",
  grey: "linear-gradient(90deg, #999999 0%, #999999 100%)",
} as const;

export type TitleTone = keyof typeof TITLE_GRADIENT;
