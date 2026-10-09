"use client";

import { motion } from "motion/react";

/**
 * The dot-matrix placeholder that stands in for text an agent hasn't
 * produced yet. From the Motion Library's reservation-agent
 * (`components/DotShimmer.tsx`), unchanged but for `motion/react`.
 *
 * It reads as a block of type at a distance: rows of tiny dots, split into
 * two column groups, with irregular gaps so it doesn't look like a printed
 * grid. A diagonal wave of opacity travels across it — the "still
 * generating" tell — and it swaps for real content the moment the turn
 * resolves.
 */

const DOT = 2;
const COL_GAP = 7;
const ROW_GAP = 9;

/**
 * Stable pseudo-random so the gap pattern is identical on every render.
 * A real RNG here would make the dots crawl on each re-render.
 */
function isOmitted(row: number, col: number) {
  const h = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
  return h - Math.floor(h) < 0.18;
}

export function DotShimmer({
  rows = 4,
  width = 320,
  /** Blank column band that splits the field into two blocks, as in the design. */
  splitAt = 0.47,
  splitWidth = 0.08,
  className = "",
}: {
  rows?: number;
  width?: number;
  splitAt?: number;
  splitWidth?: number;
  className?: string;
}) {
  const cols = Math.floor(width / COL_GAP);
  const splitStart = Math.floor(cols * splitAt);
  const splitEnd = Math.floor(cols * (splitAt + splitWidth));

  return (
    <div
      className={`pointer-events-none relative select-none ${className}`}
      style={{
        width,
        height: rows * ROW_GAP,
        // Soften both ends so the field fades out rather than stopping dead.
        maskImage:
          "linear-gradient(90deg, transparent 0%, #000 6%, #000 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, #000 6%, #000 88%, transparent 100%)",
      }}
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((__, col) => {
          if (col >= splitStart && col < splitEnd) return null;
          if (isOmitted(row, col)) return null;

          return (
            <motion.span
              key={`${row}-${col}`}
              className="absolute rounded-full bg-[#D2D2D9]"
              style={{ width: DOT, height: DOT, left: col * COL_GAP, top: row * ROW_GAP }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                // Diagonal offset — the wave sweeps left to right, top to bottom.
                delay: (col * 0.045 + row * 0.1) % 1.8,
              }}
            />
          );
        }),
      )}
    </div>
  );
}
