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
    /* A shine travelling the border, not an outline drawn on it. The Connect
       treatment that was here read as a static ring the moment it sat still,
       which is the one thing a "just completed" state must not do. */
    return (
      <div className="relative h-full w-full rounded-[inherit] bg-white shadow-[0_4px_28px_-1.92px_rgba(0,0,0,0.07)]">
        <span className="otp-lining otp-lining--green" style={{ borderRadius: "inherit" }} />
        <span className="relative z-10 flex h-full w-full items-center justify-center rounded-[inherit]">
          {children}
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
        sweepColor="#f6f8fb"
        highlightColor="#eef2f8"
        // 1px of ring, and the inner panel inset by exactly the same, or the
        // border comes out thicker on two sides than the other two. The base
        // is light enough that the travelling spark reads as a sheen rather
        // than as one edge being darker than the rest.
        style={{ width: "100%", height: "100%", padding: 1, background: "#e2e6ed" }}
        containerClassName="rounded-[inherit]! gap-0! border-0! shadow-[0_4px_28px_-1.92px_rgba(0,0,0,0.07)]"
        className="flex! h-full! w-full! items-center! justify-center! rounded-[inherit]! bg-transparent! px-0! py-0! text-[#1a1a1a]!"
        innerClassName="rounded-[15px]! bg-white! inset-[1px]!"
      >
        {children}
      </HoverBorderGradient>
    );
  }

  return (
    <div className="h-full w-full rounded-[inherit] bg-white shadow-[0_4px_28px_-1.92px_rgba(0,0,0,0.07)]" />
  );
}
