"use client";

import { AnimatePresence, motion } from "motion/react";
import { TITLE_GRADIENT, type TitleTone } from "@/lib/gradients";
import { BLUR_PEAK, EASE_IN, EASE_OUT } from "@/lib/motionTokens";

/**
 * The headline, rendered as a drum. From the Motion Library's
 * reservation-agent (`components/RollingTitle.tsx`), with the snapmap icon
 * slot dropped and `framer-motion` swapped for `motion/react` — same API,
 * it's the package this project already has.
 *
 * Both lines are faces on the same cylinder: the rotation axis sits `RADIUS`
 * behind the text (the third value of `transform-origin`), so a face swings
 * out along an arc instead of tipping in place. The outgoing face turns down
 * and away at the same moment the incoming one turns down into view, on
 * identical timing — that coupling is what makes it read as one object
 * rotating rather than two labels crossfading.
 *
 * The slot clips, so a face is cut off by the window edge as it leaves, the
 * way a physical drum would be.
 *
 * Keyed on the text, so a title repeating across turns correctly does nothing.
 */

/** How far behind the text the axis sits. Larger = wider, looser arc. */
const RADIUS = 15;
/** Shallower than the original's 88°, which put a face edge-on and made the
 *  turn read as a flip. Softened to match the onboarding prototype, where
 *  copy arrives rather than snaps. */
const ANGLE = 44;

/** Out of focus and into it, on the prototype's decelerating ease. Opacity on
 *  its own reads as a switch; the blur is what makes it read as a line
 *  settling. Duration over spring for the same reason — a spring has a
 *  character, and this wants none. */
const IN = { duration: 0.8, ease: EASE_OUT } as const;
const OUT = { duration: 0.48, ease: EASE_IN } as const;

export function RollingTitle({
  title,
  tone = "working",
  visible = true,
  height = 19,
  className = "whitespace-nowrap text-[14px] font-medium leading-[19px] tracking-[-0.28px]",
  align = "left",
  children,
}: {
  /** The face's text. Also the key, so a repeat correctly does nothing. */
  title: string;
  /** Our one addition: several of these lines are two-tone in the design, and
   *  a drum face has to be one node. Pass it here and `title` is just the key. */
  children?: React.ReactNode;
  tone?: TitleTone;
  visible?: boolean;
  /** the window the drum turns inside — match it to the line height */
  height?: number;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      // Every face inside is absolutely positioned, so without a width the
      // slot shrinks to nothing and clips them away entirely. The caller
      // sizes it; the drum just fills what it is given.
      className="w-full overflow-hidden"
      style={{
        height,
        // `isolation` keeps this 3D context from invalidating ancestors while
        // it animates. No `transform-style: preserve-3d`: the faces don't
        // nest, and perspective here is enough to give them depth.
        perspective: 460,
        perspectiveOrigin: "30% 50%",
        isolation: "isolate",
      }}
    >
      <div className="relative h-full">
        <AnimatePresence initial={false}>
          {visible && title && (
            <motion.div
              key={title}
              // Stretched and centred rather than left-1/2 + translate: an
              // absolute face there is shrink-to-fit against only half the
              // slot, so anything that wraps wraps far too early.
              className={`absolute inset-y-0 flex items-center ${
                align === "center" ? "left-0 right-0 justify-center" : "left-0 justify-start"
              }`}
              style={{ transformOrigin: `50% 50% -${RADIUS}px` }}
              initial={{ rotateX: ANGLE, opacity: 0, filter: `blur(${BLUR_PEAK}px)` }}
              animate={{ rotateX: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ rotateX: -ANGLE, opacity: 0, filter: `blur(${BLUR_PEAK}px)`, transition: OUT }}
              transition={IN}
            >
              {children ?? (
                <span
                  className={`bg-clip-text text-transparent ${className}`}
                  style={{ backgroundImage: TITLE_GRADIENT[tone] }}
                >
                  {title}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
