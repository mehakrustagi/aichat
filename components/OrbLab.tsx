"use client";

import { useState } from "react";
import {
  FlatOrb,
  GlOrb,
  LayeredOrb,
  LiquidOrb,
  ThinOrb,
} from "@/components/OrbVariants";
import { useDeviceMotion } from "@/hooks/useDeviceMotion";
import { ORBS, type Orb } from "@/lib/orbs";
import type { MotionRef } from "@/hooks/useDeviceMotion";

/**
 * Every treatment, side by side, on whichever orb you pick — so the choice
 * gets made by looking rather than by remembering what the last one did.
 *
 * All six take the same live tilt, so tilting the phone moves all of them at
 * once and the only variable is the treatment.
 */
const VARIANTS: {
  key: string;
  name: string;
  note: string;
  render: (p: { orb: Orb; size: number; motion: MotionRef }) => React.ReactNode;
}[] = [
  {
    key: "flat",
    name: "Flat sprite",
    note: "The Figma export, clipped to a circle. Nothing added — the baseline.",
    render: (p) => <FlatOrb {...p} />,
  },
  {
    key: "layered",
    name: "CSS layers",
    note: "Shell holds still, a masked copy of the art slides inside it, soft specular on top.",
    render: (p) => <LayeredOrb {...p} />,
  },
  {
    key: "thin",
    name: "Thin reflections",
    note: "A hard streak across the face and two rim arcs, both tracking the light. No refraction.",
    render: (p) => <ThinOrb {...p} />,
  },
  {
    key: "liquid",
    name: "Liquid glass",
    note: "KokonutUI's turbulence displacement over the art, with their inset shadow stack.",
    render: (p) => <LiquidOrb {...p} />,
  },
  {
    key: "gl",
    name: "Shader",
    note: "Real refraction through a sphere normal: contents magnify in the middle, crush at the rim.",
    render: (p) => <GlOrb {...p} shell={false} />,
  },
  {
    key: "gl-shell",
    name: "Shader + painted shell",
    note: "The same, with the designed line work drawn back over it. What the screen uses now.",
    render: (p) => <GlOrb {...p} shell />,
  },
];

const PICKABLE = ORBS.filter((o) => !o.anchored);

export function OrbLab() {
  const { motion, needsPermission, request } = useDeviceMotion();
  const [orbId, setOrbId] = useState("27308");
  const [size, setSize] = useState(168);
  const [chosen, setChosen] = useState<string | null>(null);

  const orb = PICKABLE.find((o) => o.id === orbId) ?? PICKABLE[0];

  return (
    <main className="min-h-dvh bg-[#f9fafb] px-4 pb-28 text-[#0b0b0b]">
      <div className="mx-auto max-w-[760px]">
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-[#f9fafb] py-4">
          <h1 className="mr-auto text-[17px] font-semibold tracking-[-0.4px]">Orb treatments</h1>
          {needsPermission && (
            <button
              type="button"
              onClick={request}
              className="rounded-full bg-black px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              Enable motion
            </button>
          )}
          <select
            value={orbId}
            onChange={(e) => setOrbId(e.target.value)}
            className="rounded-full border border-[#d6d9dc] bg-white px-3 py-1.5 text-[12px] font-medium"
          >
            {PICKABLE.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[12px] text-[#6d6d6d]">
            size
            <input
              type="range"
              min={80}
              max={260}
              step={4}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-[90px] accent-black"
            />
          </label>
        </header>

        <p className="mb-5 text-[13px] leading-[18px] text-[#6d6d6d]">
          Tilt the phone — every tile is driven by the same sensor, so the only
          thing that differs is the treatment. Tap one to mark it.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {VARIANTS.map((v) => {
            const picked = chosen === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setChosen(picked ? null : v.key)}
                className={`flex flex-col items-center gap-3 rounded-[20px] border bg-white p-4 text-left transition-colors ${
                  picked ? "border-[#0d9b63] ring-2 ring-[#0d9b63]/25" : "border-[#e8eaee]"
                }`}
              >
                <span className="flex h-[260px] w-full items-center justify-center">
                  {v.render({ orb, size, motion })}
                </span>
                <span className="w-full">
                  <span className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold tracking-[-0.2px]">{v.name}</span>
                    {picked && (
                      <span className="rounded-full bg-[#0d9b63] px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.6px] text-white">
                        picked
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[12px] leading-[16px] text-[#6d6d6d]">
                    {v.note}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {chosen && (
          <p className="mt-6 rounded-[16px] bg-white p-4 text-[13px] leading-[18px] text-[#1a1a1a] ring-1 ring-[#e8eaee]">
            Marked <strong>{VARIANTS.find((v) => v.key === chosen)?.name}</strong>. Tell me and
            I&rsquo;ll make it the one the screen uses — the others stay here so we can come back
            to them.
          </p>
        )}
      </div>
    </main>
  );
}
