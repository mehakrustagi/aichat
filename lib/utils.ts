/* Class-name joiner.
 *
 * The Aceternity components in components/ui are written against a `cn`
 * built from clsx + tailwind-merge. Neither earns a dependency here: nothing
 * passes two CONFLICTING Tailwind classes through `cn` and relies on the
 * later one winning, which is the only thing tailwind-merge buys you. If
 * that changes, install it and swap this body out — the call sites are
 * already the right shape. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
