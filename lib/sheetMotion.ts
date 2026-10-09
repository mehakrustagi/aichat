import type { Variants } from "motion/react";

/**
 * The entrance, lifted from KokonutUI's SmoothDrawer.
 *
 * It's a spring rather than a duration, with a few degrees of rotateX on the
 * way in, so the sheet tips up into place instead of sliding flat — and the
 * contents stagger in behind it rather than arriving as one block. Only the
 * motion is borrowed; the sheets themselves are ours.
 */
export const sheetVariants: Variants = {
  hidden: (closedY: number) => ({
    y: closedY,
    opacity: 0,
    rotateX: 5,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  }),
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

export const sheetItem: Variants = {
  hidden: { y: 20, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
  },
};
