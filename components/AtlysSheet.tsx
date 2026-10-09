"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { sheetItem, sheetVariants } from "@/lib/sheetMotion";
import { LoaderOne } from "@/components/ui/loader";
import { haptic } from "@/lib/haptics";

export const ATLYS_SHEET_HEIGHT = 680;

/**
 * Signing in through an existing Atlys account (Figma 458:20558 →
 * 458:23555 → 458:24053 → 458:24470).
 *
 * The first two stages run themselves — they're a progress narrative, not a
 * decision — then it waits on "Access via Atlys" before the handshake lands.
 */
type Stage = "connecting" | "profile" | "confirm" | "connected";

/** ms each self-advancing stage holds before the next */
const HOLD = { connecting: 2200, profile: 2200, connected: 1900 } as const;

const POSTCARDS = [
  { src: "/atlys/card-halong.png", rotate: -9 },
  { src: "/atlys/card-monument.png", rotate: -4.5 },
  { src: "/atlys/card-eiffel.png", rotate: 0 },
  { src: "/atlys/card-santorini.png", rotate: 4.5 },
  { src: "/atlys/card-rio.png", rotate: 9 },
];

function Tile({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex h-[77px] w-[77px] items-center justify-center rounded-[22px] bg-white shadow-[0_6px_28px_-6px_rgba(0,0,0,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}

function TaskRow({
  label,
  accent,
  done,
  active,
}: {
  label: string;
  accent: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className="flex h-[48px] w-full items-center gap-[14px] transition-opacity duration-300"
      style={{ opacity: done || active ? 1 : 0 }}
    >
      {done ? (
        <span className="flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full bg-black">
          <svg viewBox="0 0 24 24" fill="none" className="h-[13px] w-[13px]">
            <path d="m5 12.5 4.5 4.5L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : (
        <span className="h-[23px] w-[23px] shrink-0 rounded-full border-[1.5px] border-[#d6d9dc] border-t-[#9aa3b1] motion-safe:animate-spin [animation-duration:1.1s]" />
      )}
      <p className="text-[16px] font-medium leading-[20px] tracking-[-0.3px] text-[#1a1a1a]">
        {label.split("|")[0]}
        <span style={{ color: accent }}>{label.split("|")[1]}</span>
      </p>
      {!done && (
        <span className="ml-auto flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#0d9b63]">
          <svg viewBox="0 0 24 24" fill="none" className="h-[12px] w-[12px]">
            <path d="m5 12.5 4.5 4.5L19 7" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
}

function Sparkle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute motion-safe:animate-[sparkle_1.6s_ease-in-out_infinite]"
      style={{ left: x, top: y, width: size, height: size, animationDelay: `${delay}ms` }}
      aria-hidden
    >
      <path d="M12 0c.6 6.6 4.8 10.8 12 12-7.2 1.2-11.4 5.4-12 12-.6-6.6-4.8-10.8-12-12C7.2 10.8 11.4 6.6 12 0Z" fill="#F5C518" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onDone: () => void;
  onDismiss: () => void;
};

export function AtlysSheet({ open, onDone, onDismiss }: Props) {
  const [stage, setStage] = useState<Stage>("connecting");
  const timers = useRef<number[]>([]);

  // Reset and run the opening narrative each time the sheet comes up.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restarts the narrative each time the sheet opens
    setStage("connecting");
    timers.current = [
      window.setTimeout(() => setStage("profile"), HOLD.connecting),
      window.setTimeout(() => setStage("confirm"), HOLD.connecting + HOLD.profile),
    ];
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [open]);

  const accept = () => {
    haptic("commit");
    setStage("connected");
    window.setTimeout(() => {
      haptic("success");
      onDone();
    }, HOLD.connected);
  };

  const working = stage === "connecting" || stage === "profile";
  const connected = stage === "connected";

  return (
    <motion.div
      className="absolute bottom-0 left-0 w-[440px] overflow-hidden rounded-t-[44px] bg-white shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.12)]"
      style={{ height: ATLYS_SHEET_HEIGHT, transformPerspective: 1400 }}
      variants={sheetVariants}
      custom={ATLYS_SHEET_HEIGHT + 40}
      initial="hidden"
      animate={open ? "visible" : "hidden"}
      role="dialog"
      aria-label="Connecting to Atlys"
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute left-1/2 top-[12px] h-[2px] w-[24px] -translate-x-1/2 rounded-full bg-[#d6d9dc]"
      />

      {/* --- the two parties, and the handshake between them ---------- */}
      <motion.div variants={sheetItem} className="absolute left-1/2 top-[94px] flex h-[77px] -translate-x-1/2 items-center">
        <Tile>
          <Image
            src="/orbs/orb-7.png"
            alt=""
            width={46}
            height={46}
            style={{ width: 46, height: 46 }}
            className="rounded-full"
          />
        </Tile>

        {/* the dots give way to the green check once the handshake lands */}
        <div className="relative flex w-[128px] items-center justify-center">
          {/* Aceternity's LoaderOne, scaled to the weight the sheet wants —
              the motion is the component's, the size is ours. */}
          <div
            className="transition-opacity duration-300"
            style={{ opacity: connected ? 0 : 1, transform: "scale(0.55)" }}
          >
            <LoaderOne />
          </div>
          <div
            className="absolute transition-all duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ opacity: connected ? 1 : 0, transform: `scale(${connected ? 1 : 0.6})` }}
          >
            <Tile className="!bg-[#e9f7f0]">
              <svg viewBox="0 0 24 24" fill="none" className="h-[40px] w-[40px]">
                <circle cx="12" cy="12" r="9.5" stroke="#0d9b63" strokeWidth="1.9" />
                <path d="m7.6 12.4 3.1 3.1 5.7-6" stroke="#0d9b63" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Tile>
          </div>
        </div>

        <Tile>
          <Image
            src="/icons/atlys-logo.svg"
            alt="atlys"
            width={56}
            height={25}
            style={{ width: 56, height: 25 }}
          />
        </Tile>

        {connected && (
          <>
            <Sparkle x={-8} y={-22} size={13} delay={0} />
            <Sparkle x={96} y={-34} size={10} delay={240} />
            <Sparkle x={86} y={74} size={11} delay={480} />
            <Sparkle x={186} y={-16} size={9} delay={160} />
            <Sparkle x={168} y={84} size={12} delay={360} />
          </>
        )}
      </motion.div>

      {/* --- copy ----------------------------------------------------- */}
      <motion.div variants={sheetItem} className="absolute left-1/2 top-[228px] flex w-[340px] -translate-x-1/2 flex-col items-center gap-[10px] text-center">
        <p className="whitespace-nowrap text-[24px] font-medium leading-[28px] tracking-[-0.96px] text-[#0b0b0b]">
          {stage === "confirm" ? (
            "Confirm your credentials"
          ) : connected ? (
            <>
              You&rsquo;re <span className="text-[#0d9b63]">connected</span>
            </>
          ) : (
            <>
              Connecting to <span className="text-[#0d9b63]">Atlys</span>
            </>
          )}
        </p>
        <p className="text-[16px] font-medium leading-[20px] tracking-[-0.64px] text-[#999]">
          {stage === "confirm"
            ? "Verify your Atlys account now!"
            : connected
              ? "Welcome to Hermes"
              : "Starting secure communication"}
        </p>
      </motion.div>

      {/* --- progress ------------------------------------------------- */}
      <div
        className="absolute left-[40px] top-[330px] flex w-[360px] flex-col transition-opacity duration-300"
        style={{ opacity: working ? 1 : 0 }}
      >
        <TaskRow
          label="Retrieving |your visas"
          accent="#e07a3f"
          done={stage === "profile"}
          active
        />
        <TaskRow
          label="Collecting |your profile data"
          accent="#0d9b63"
          done={false}
          active={stage === "profile"}
        />
      </div>

      {/* --- what is being retrieved ---------------------------------- */}
      <div
        className="absolute left-[45px] top-[414px] h-[170px] w-[350px] overflow-hidden rounded-[20px] bg-white shadow-[0_8px_36px_-10px_rgba(0,0,0,0.14)] transition-all duration-[420ms]"
        style={{
          opacity: working ? 1 : 0,
          transform: `translateY(${working ? 0 : 12}px)`,
        }}
      >
        <div className="flex flex-col gap-[7px] px-[18px] pt-[16px]">
          <span className="h-[7px] w-[96px] rounded-full bg-[#eceef1]" />
          <span className="h-[7px] w-[150px] rounded-full bg-[#f2f4f6]" />
        </div>
        {/* stage one shows the visas themselves; stage two is still loading */}
        <div
          className="absolute bottom-0 left-0 flex w-full items-end justify-center gap-[6px] px-[16px] pb-[8px] transition-opacity duration-500"
          style={{ opacity: stage === "connecting" ? 1 : 0 }}
        >
          {POSTCARDS.map((c) => (
            <Image
              key={c.src}
              src={c.src}
              alt=""
              width={60}
              height={82}
              style={{ width: 60, height: 82, transform: `rotate(${c.rotate}deg)` }}
              className="rounded-[6px] border-[3px] border-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)]"
            />
          ))}
        </div>
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: stage === "profile" ? 1 : 0 }}
        >
          <div
            className="absolute inset-0 motion-safe:animate-[shimmer_1.8s_linear_infinite]"
            style={{
              background:
                "linear-gradient(100deg, rgba(255,255,255,0) 20%, rgba(214,232,255,0.55) 45%, rgba(255,255,255,0) 70%)",
              backgroundSize: "220% 100%",
            }}
          />
          <span className="absolute bottom-[18px] left-[18px] h-[4px] w-[16px] rounded-full bg-[#4c9cf0]" />
        </div>
      </div>

      {/* --- the decision --------------------------------------------- */}
      <div
        // No -translate-x-1/2 here: Tailwind v4 emits the `translate`
        // property, which composes with the inline `transform` below rather
        // than being overridden by it, and the card lands half a width left.
        className="absolute left-1/2 top-[330px] flex w-[350px] flex-col items-center transition-all duration-[420ms]"
        style={{
          opacity: stage === "confirm" ? 1 : 0,
          pointerEvents: stage === "confirm" ? "auto" : "none",
          transform: `translateX(-50%) translateY(${stage === "confirm" ? 0 : 14}px)`,
        }}
      >
        <div className="flex w-full items-center gap-[14px] rounded-[18px] bg-gradient-to-r from-[#eef2fb] to-[#f7f5fb] px-[16px] py-[14px]">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#c9dbf5] text-[13px] font-semibold text-[#4a6a99]">
            HF
          </span>
          <span className="flex flex-col">
            <span className="text-[16px] font-medium leading-[21px] tracking-[-0.3px] text-[#0b0b0b]">
              Herbert Franco
            </span>
            <span className="text-[14px] font-medium leading-[19px] tracking-[-0.28px] text-[#999]">
              herbert.franco@atlys.com
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={accept}
          className="relative mt-[46px] h-[50px] w-[340px] overflow-hidden rounded-[84px]"
        >
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[84px]">
            <Image
              src="/icons/pill-gradient.svg"
              alt=""
              width={371.659}
              height={179.296}
              style={{ left: 2.41, top: -64.64, width: 371.659, height: 179.296 }}
              className="absolute max-w-none animate-[pill-drift_14s_ease-in-out_infinite]"
            />
          </span>
          <span className="pointer-events-none absolute inset-0 rounded-[84px] bg-white/10" />
          <span className="relative text-[14px] font-semibold tracking-[-0.14px] text-black">
            Access via Atlys
          </span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-[26px] text-[14px] font-medium tracking-[-0.28px] text-[#1a1a1a] underline underline-offset-[3px]"
        >
          Log in to another account
        </button>
      </div>

      <Image
        src="/otp/union.svg"
        alt=""
        width={379}
        height={214}
        style={{ width: 379, height: 214 }}
        className="pointer-events-none absolute bottom-[-150px] left-[30px] max-w-none"
      />
    </motion.div>
  );
}
