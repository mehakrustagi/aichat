import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Class-name joiner for the vendored components in components/ui.
 *
 * This started as a plain join, on the reasoning that nothing passed two
 * CONFLICTING Tailwind utilities through it and relied on the later one
 * winning. That stopped being true the moment a vendored component needed
 * overriding: MultiStepLoader hardcodes `mt-40`, and a caller passing `mt-0`
 * lost silently — equal specificity means the stylesheet's order decides, not
 * the order you wrote them in, and the step list rendered 160px down the page
 * on top of something else.
 *
 * tailwind-merge is what makes `className` props on these components mean
 * what they look like they mean.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
