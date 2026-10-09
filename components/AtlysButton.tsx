"use client";

import Image from "next/image";
import { LiquidPill } from "@/components/motion/LiquidPill";

/**
 * "Login using your atlys account" (Figma 458:27253).
 *
 * The word "Atlys" in the label is transparent — the logo sits over it, and
 * the gap is what reserves its space.
 */
export function AtlysButton({ onClick }: { onClick?: () => void }) {
  return (
    <LiquidPill onTap={onClick} ariaLabel="Login using your Atlys account">
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
    </LiquidPill>
  );
}
