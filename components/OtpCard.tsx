"use client";

import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

export type CardState = "empty" | "filled" | "verified";

/**
 * One OTP box, in its three dresses.
 *
 *   empty     a plain card
 *   filled    Aceternity's HoverBorderGradient — a silver spark running the
 *             border, driven by `active` rather than hover, because nothing
 *             hovers on a phone
 *   verified  the Tailwind Connect treatment in green: a glow pooling at the
 *             top and a hairline under the foot, both sweeping
 */
export function OtpCard({
  state,
  children,
}: {
  state: CardState;
  children?: React.ReactNode;
}) {
  if (state === "verified") {
    return (
      <div className="relative h-full w-full rounded-[inherit] bg-emerald-500/15 p-px shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)]">
        {/* the pool of light at the head */}
        <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="absolute inset-0 rounded-[inherit] bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(16,185,129,0.75)_0%,rgba(16,185,129,0)_75%)] bg-[length:200%_100%] motion-safe:animate-[connect-glow_2.4s_ease-in-out_infinite]" />
        </span>

        <div className="relative z-10 flex h-full w-full items-center justify-center rounded-[inherit] bg-white ring-1 ring-emerald-500/25">
          {children}
        </div>

        {/* and the hairline under the foot */}
        <span className="absolute -bottom-px left-[14%] h-px w-[72%] overflow-hidden">
          <span className="block h-full w-full bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 motion-safe:animate-[connect-hairline_2.4s_ease-in-out_infinite]" />
        </span>
      </div>
    );
  }

  if (state === "filled") {
    return (
      <HoverBorderGradient
        as="div"
        active
        duration={0.75}
        sweepColor="#ffffff"
        highlightColor="#e8edf5"
        style={{ width: "100%", height: "100%", padding: 1.5, background: "#c6cdd9" }}
        containerClassName="rounded-[inherit]! gap-0! border-0! shadow-[0_4px_28px_-1.92px_rgba(0,0,0,0.07)]"
        className="flex! h-full! w-full! items-center! justify-center! rounded-[inherit]! bg-transparent! px-0! py-0! text-[#1a1a1a]!"
        innerClassName="rounded-[inherit]! bg-white! inset-[1.5px]!"
      >
        {children}
      </HoverBorderGradient>
    );
  }

  return (
    <div className="h-full w-full rounded-[inherit] bg-white shadow-[0_4px_28px_-1.92px_rgba(0,0,0,0.07)]" />
  );
}
