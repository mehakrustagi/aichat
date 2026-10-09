"use client";
import React, { useState, useEffect } from "react";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

/**
 * Aceternity's HoverBorderGradient, with two changes.
 *
 * 1. The gradients are repaired. The published registry entry ships them
 *    mangled — missing colour stops and closing parens — so the background
 *    is invalid CSS and the travelling highlight never renders at all.
 * 2. It can dress a light surface and run without a pointer: `innerClassName`
 *    replaces the hardcoded black panel, `sweepColor`/`highlightColor` set
 *    the travelling light, and `active` drives it from state rather than
 *    hover, which is what a touch screen needs.
 *
 * Everything else — the four-position rotation, the timing, the blur — is
 * the component as published.
 */
export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  innerClassName,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  sweepColor = "hsl(0, 0%, 100%)",
  highlightColor = "#3275F8",
  active = false,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    innerClassName?: string;
    duration?: number;
    clockwise?: boolean;
    sweepColor?: string;
    highlightColor?: string;
    active?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  const movingMap: Record<Direction, string> = {
    TOP: `radial-gradient(20.7% 50% at 50% 0%, ${sweepColor} 0%, rgba(255, 255, 255, 0) 100%)`,
    LEFT: `radial-gradient(16.6% 43.1% at 0% 50%, ${sweepColor} 0%, rgba(255, 255, 255, 0) 100%)`,
    BOTTOM: `radial-gradient(20.7% 50% at 50% 100%, ${sweepColor} 0%, rgba(255, 255, 255, 0) 100%)`,
    RIGHT: `radial-gradient(16.2% 41.2% at 100% 50%, ${sweepColor} 0%, rgba(255, 255, 255, 0) 100%)`,
  };

  const highlight = `radial-gradient(75% 181.15942028985506% at 50% 50%, ${highlightColor} 0%, rgba(255, 255, 255, 0) 100%)`;

  useEffect(() => {
    if (hovered) return;
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const interval = setInterval(() => {
      setDirection((prev) => {
        const i = directions.indexOf(prev);
        const next = clockwise
          ? (i - 1 + directions.length) % directions.length
          : (i + 1) % directions.length;
        return directions[next];
      });
    }, duration * 1000);
    return () => clearInterval(interval);
  }, [hovered, duration, clockwise]);

  const lit = hovered || active;

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center gap-10 overflow-visible rounded-full border border-black/10 bg-black/20 p-px decoration-clone transition duration-500 hover:bg-black/10 dark:bg-white/20",
        containerClassName,
      )}
      {...props}
    >
      <div className={cn("z-10 w-auto rounded-[inherit] bg-black px-4 py-2 text-white", className)}>
        {children}
      </div>
      <motion.div
        className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
        style={{ filter: "blur(2px)", position: "absolute", width: "100%", height: "100%" }}
        initial={{ background: movingMap[direction] }}
        animate={{ background: lit ? [movingMap[direction], highlight] : movingMap[direction] }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      <div className={cn("absolute inset-[2px] z-[1] flex-none rounded-[100px] bg-black", innerClassName)} />
    </Tag>
  );
}
