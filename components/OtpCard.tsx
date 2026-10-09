"use client";


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
    /* The same revolving sweep the verified state uses, in chrome instead of
       green, so a box filling and a box verifying are the same gesture at two
       temperatures.
       HoverBorderGradient was here and did not read: it steps a blurred
       highlight between four edge positions, which is a pulse rather than a
       revolution, and on a white card a white highlight over a pale base is
       nothing at all. */
    return (
      <div className="relative h-full w-full rounded-[inherit] bg-white shadow-[0_4px_28px_-1.92px_rgba(0,0,0,0.07)]">
        <span className="otp-lining otp-lining--silver" style={{ borderRadius: "inherit" }} />
        <span className="relative z-10 flex h-full w-full items-center justify-center rounded-[inherit]">
          {children}
        </span>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-[inherit] bg-white shadow-[0_4px_28px_-1.92px_rgba(0,0,0,0.07)]" />
  );
}
