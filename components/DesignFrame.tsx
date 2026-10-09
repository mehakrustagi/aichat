"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FRAME_HEIGHT, FRAME_WIDTH } from "@/lib/orbs";

/**
 * Renders children in the Figma 440 x 956 coordinate space and scales the whole
 * thing to fit the viewport, so every value in the tree stays design-exact.
 */
export function DesignFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(
        window.innerWidth / FRAME_WIDTH,
        window.innerHeight / FRAME_HEIGHT,
      );
      setScale(s);
      setReady(true);
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#e9ebef]">
      <div
        className="relative shrink-0 overflow-hidden rounded-[44px] bg-[#f9fafb]"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          visibility: ready ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
