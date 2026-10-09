"use client";

import { useEffect, useState } from "react";
import { OrbCluster } from "@/components/OrbCluster";
import { useDeviceMotion } from "@/hooks/useDeviceMotion";
import {
  ORB_GLASS_DEFAULTS,
  ORB_GLASS_SLIDERS,
  type OrbGlass,
} from "@/lib/orbGlass";

/**
 * The bench. Every knob from the glass model, live, on whatever device you
 * are holding — so the orbs get tuned while being tilted and shaken rather
 * than by reading numbers off a screenshot.
 *
 * Values persist per-browser and `Copy` hands back the JSON to paste into
 * ORB_GLASS_DEFAULTS once a look is settled.
 */
const STORE_KEY = "orb-glass-tuning";

export function OrbBench() {
  const { motion, needsPermission, request } = useDeviceMotion();
  const [glass, setGlass] = useState<OrbGlass>(ORB_GLASS_DEFAULTS);
  const [copied, setCopied] = useState(false);

  // Restore after mount — localStorage can throw in private mode, and the
  // server has no idea what's in it either way.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- storage is browser-only
      if (raw) setGlass({ ...ORB_GLASS_DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // nothing saved, or storage is blocked — defaults are fine
    }
  }, []);

  const set = <K extends keyof OrbGlass>(key: K, value: OrbGlass[K]) => {
    setGlass((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        // tuning still applies for this session
      }
      return next;
    });
  };

  const reset = () => {
    setGlass(ORB_GLASS_DEFAULTS);
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      // nothing to clear
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(glass, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard needs a secure context; the values are still on screen
    }
  };

  const groups = [...new Set(ORB_GLASS_SLIDERS.map((s) => s.group))];

  return (
    <main className="min-h-dvh bg-[#f9fafb] text-[#0b0b0b]">
      <div className="sticky top-0 z-10 overflow-hidden bg-[#f9fafb]">
        <div className="mx-auto w-[440px] origin-top scale-[min(1,calc(100vw/440))]">
          <OrbCluster motion={motion} glass={glass} className="block" />
        </div>
      </div>

      <div className="mx-auto max-w-[520px] px-4 pb-24">
        <div className="sticky top-0 flex items-center gap-2 bg-[#f9fafb] py-3">
          <h1 className="mr-auto text-[15px] font-semibold tracking-[-0.3px]">Orb glass</h1>
          {needsPermission && (
            <button
              type="button"
              onClick={request}
              className="rounded-full bg-black px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              Enable motion
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            className="rounded-full border border-[#d6d9dc] bg-white px-3 py-1.5 text-[12px] font-semibold"
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-[#d6d9dc] bg-white px-3 py-1.5 text-[12px] font-semibold"
          >
            Reset
          </button>
        </div>

        {groups.map((group) => (
          <section key={group} className="mb-6">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.88px] text-[#6d6d6d]">
              {group}
            </h2>

            {group === "Glass" && (
              <>
                <Row label="tint">
                  <input
                    type="color"
                    value={glass.tint}
                    onChange={(e) => set("tint", e.target.value)}
                    className="h-7 w-16 rounded border border-[#d6d9dc] bg-white"
                  />
                </Row>
                <Row label="gloss shape">
                  <select
                    value={glass.glossShape}
                    onChange={(e) => set("glossShape", e.target.value as OrbGlass["glossShape"])}
                    className="rounded border border-[#d6d9dc] bg-white px-2 py-1 text-[12px]"
                  >
                    <option value="single">single</option>
                    <option value="dual">dual</option>
                  </select>
                </Row>
              </>
            )}
            {group === "Physical glass" && (
              <Toggle
                label="on"
                checked={glass.physicalOn}
                onChange={(v) => set("physicalOn", v)}
              />
            )}
            {group === "Solid glass (painted lens)" && (
              <Toggle label="on" checked={glass.solidOn} onChange={(v) => set("solidOn", v)} />
            )}

            {ORB_GLASS_SLIDERS.filter((s) => s.group === group).map((s) => (
              <Row key={s.key} label={s.label}>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={glass[s.key] as number}
                  onChange={(e) => set(s.key, Number(e.target.value) as never)}
                  className="h-7 flex-1 accent-black"
                />
                <span className="w-14 shrink-0 text-right font-mono text-[12px] tabular-nums text-[#6d6d6d]">
                  {glass[s.key] as number}
                </span>
              </Row>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 py-1">
      <span className="w-[130px] shrink-0 text-[13px] tracking-[-0.2px]">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-black"
      />
    </Row>
  );
}
