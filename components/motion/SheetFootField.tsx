"use client";

import { DotShimmer } from "@/components/motion/DotShimmer";

/**
 * The perforated field at the foot of a bottom sheet.
 *
 * Figma ships this as a flat SVG of static dots. Using the Motion Library's
 * DotShimmer instead gives it the same diagonal wave the agent cards use, so
 * the foot of the sheet reads as part of the same living surface rather than
 * a printed texture.
 *
 * `splitWidth={0}` because the blank column band in the original is there to
 * make it read as two blocks of type — here it is decoration, and wants to be
 * continuous.
 */
export function SheetFootField({
  rows = 6,
  width = 380,
  /** px up from the sheet's foot — used when something else sits down there. */
  bottom = 0,
  className = "",
}: {
  rows?: number;
  width?: number;
  bottom?: number;
  className?: string;
}) {
  const height = rows * 9;
  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 overflow-hidden ${className}`}
      style={{
        width,
        height,
        bottom,
        // Fades into the sheet going up, so it sits under the content rather
        // than starting abruptly.
        maskImage: "linear-gradient(180deg, transparent 0%, #000 60%, #000 100%)",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 60%, #000 100%)",
      }}
      aria-hidden
    >
      <DotShimmer rows={rows} width={width} splitWidth={0} />
    </div>
  );
}
