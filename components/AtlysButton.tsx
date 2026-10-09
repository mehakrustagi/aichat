"use client";

import Image from "next/image";

/**
 * "Login using your atlys account" pill (Figma 458:27253).
 * The colour comes from a group of blurred ellipses clipped to the pill; the
 * two stacked copies are how the design builds up its saturation.
 */
export function AtlysButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Login using your Atlys account"
      className="relative h-[50px] w-[340px] shrink-0 overflow-hidden rounded-[84px]"
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[84px]">
        <Image
          src="/icons/pill-gradient.svg"
          alt=""
          width={371.659}
          height={179.296}
          className="absolute max-w-none animate-[pill-drift_14s_ease-in-out_infinite]"
          style={{ left: 2.41, top: -64.64, width: 371.659, height: 179.296 }}
        />
        <Image
          src="/icons/pill-gradient.svg"
          alt=""
          width={371.659}
          height={179.296}
          className="absolute max-w-none animate-[pill-drift_14s_ease-in-out_infinite_reverse]"
          style={{ left: 2.41, top: -64.64, width: 371.659, height: 179.296 }}
        />
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-[84px] bg-white/10" />
      <span className="absolute left-[64.33px] top-[15.83px] whitespace-nowrap text-[14px] font-semibold leading-[19px] tracking-[-0.14px] text-black">
        Login using your <span className="text-transparent">Atlys</span> account
      </span>
      <Image
        src="/icons/atlys-logo.svg"
        alt="atlys"
        width={35.147}
        height={15.51}
        style={{ width: 35.147, height: 15.51 }}
        className="pointer-events-none absolute left-[179px] top-[19px]"
      />
    </button>
  );
}
