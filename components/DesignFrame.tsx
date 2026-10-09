"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FRAME_HEIGHT, FRAME_WIDTH } from "@/lib/orbs";

/**
 * Renders children in the Figma 440 x 956 coordinate space and scales the
 * whole thing to fit the viewport, so every value in the tree stays
 * design-exact.
 *
 * Fitting is `min(width, height)` so the entire design stays on screen. On a
 * handset that usually leaves a band at the sides — a 458 x 1018 viewport is
 * a slightly different shape to a 440 x 956 design — and filling the width
 * instead would push the keypad and the home indicator off the bottom. So
 * the band stays and is made invisible: on a touch device the surround takes
 * the screen's own colour and the frame drops its corners, which reads as
 * edge-to-edge rather than as a phone sitting on a desk.
 *
 * It re-fits against `visualViewport` as well as `resize`, so the scale
 * follows the URL bar collapsing instead of jumping once it settles.
 */
const FRAME_BG = "#f9fafb";
const DESKTOP_BG = "#e9ebef";

export function DesignFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);
  const [bleed, setBleed] = useState(false);

  useEffect(() => {
    const fit = () => {
      // visualViewport is the part actually visible under the browser chrome;
      // innerHeight lags it on mobile Chrome while the URL bar animates.
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setScale(Math.min(vw / FRAME_WIDTH, vh / FRAME_HEIGHT));
      setReady(true);
    };
    fit();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-mount capability probe
    setBleed(window.matchMedia("(pointer: coarse)").matches);

    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
    };
  }, []);

  return (
    <div
      className="flex h-dvh w-full touch-none items-center justify-center overflow-hidden"
      style={{ background: bleed ? FRAME_BG : DESKTOP_BG }}
    >
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          background: FRAME_BG,
          borderRadius: bleed ? 0 : 44,
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
