"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { OtpCard } from "@/components/OtpCard";
import { sheetItem, sheetVariants } from "@/lib/sheetMotion";
import { haptic } from "@/lib/haptics";
import { FRAME_HEIGHT } from "@/lib/orbs";

export const OTP_LENGTH = 6;
export const SHEET_HEIGHT = 440;
/** The sheet stops here so the number pad underneath stays reachable. */
export const SHEET_BOTTOM = 648;
const SHEET_TOP = SHEET_BOTTOM - SHEET_HEIGHT;
/** Closed, it has to clear the bottom of the frame entirely — anything less
 *  and it peeks up over the screen and eats taps meant for what's beneath. */
const CLOSED_Y = FRAME_HEIGHT - SHEET_TOP;

const BOX_W = 50;
const BOX_H = 58;
const GAP = 12;
const ROW_LEFT = 40;
const ROW_TOP = 191;

/**
 * Stages of the verify sequence.
 *
 * The six boxes don't cross-fade into a seventh element — they physically
 * collect. Each one flies horizontally to the centre of the row and lands
 * on the pile, outermost first, so the two centre cards arrive last and sit
 * on top. They land slightly askew, the way a gathered deck does, and only
 * square up on the beat after. That squaring-up IS the merge.
 */
type Stage = "typing" | "green" | "gather" | "settle" | "check" | "verified";

/** ms after the last digit lands */
const SEQUENCE: [Stage, number][] = [
  ["green", 60],
  ["gather", 220],
  ["settle", 960],
  ["check", 1140],
  ["verified", 1620],
];
/** and then the sheet leaves */
const DISMISS_AT = 2900;

const ROW_W = BOX_W * OTP_LENGTH + GAP * (OTP_LENGTH - 1);
/** how far card `i` must travel for its centre to reach the row's centre */
const travel = (i: number) => ROW_W / 2 - (i * (BOX_W + GAP) + BOX_W / 2);

/**
 * They all set off together and move at the same speed, so the ones with
 * furthest to come take longest and land last. Giving every card the same
 * duration instead makes the outer ones visibly race, which is the one
 * thing that stops it reading as a hand sweeping a spread together.
 */
const SPEED = 2.3; // ms per px
const glide = (i: number) => 240 + Math.abs(travel(i)) * SPEED;
/** Last to land sits on top — which means the outermost pair. */
const depth = (i: number) => Math.round(Math.abs(i - 2.5) * 2) + (i > 2.5 ? 1 : 0);
const TOP_CARD = OTP_LENGTH - 1;

/** How askew each card sits once it's on the pile, before they square up. */
const SKEW = [-3.6, 2.4, -1.5, 1.5, -2.4, 3.6];
const NUDGE = [2, -1.5, 1, -1, 1.5, -2];

/** the card the tick appears on, once the deck is one */
const CHECK_SIZE = 66;

type Props = {
  code: string;
  open: boolean;
  onDone: () => void;
};

export function OtpSheet({ code, open, onDone }: Props) {
  const [stage, setStage] = useState<Stage>("typing");
  const [resendIn, setResendIn] = useState(56);
  const timers = useRef<number[]>([]);

  const full = code.length === OTP_LENGTH;

  // Walk the verify sequence once the sixth digit lands.
  useEffect(() => {
    if (!full) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the sequence when a digit is deleted
      setStage("typing");
      return;
    }
    haptic("otpMerge");
    timers.current = [
      ...SEQUENCE.map(([s, at]) => window.setTimeout(() => setStage(s), at)),
      window.setTimeout(() => {
        haptic("success");
        onDone();
      }, DISMISS_AT),
    ];
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [full, onDone]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [open]);

  const gathered = stage === "gather" || stage === "settle" || stage === "check" || stage === "verified";
  const squared = stage === "settle" || stage === "check" || stage === "verified";
  const ticked = stage === "check" || stage === "verified";
  const green = stage !== "typing";

  return (
    <motion.div
      className="absolute left-0 w-[440px] overflow-hidden rounded-[44px] bg-white shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.12)]"
      style={{ height: SHEET_HEIGHT, top: SHEET_TOP, transformPerspective: 1400 }}
      variants={sheetVariants}
      custom={CLOSED_Y}
      initial="hidden"
      animate={open ? "visible" : "hidden"}
      role="dialog"
      aria-label="Enter OTP"
      aria-hidden={!open}
    >
      {/* grab handle */}
      <div className="absolute left-1/2 top-[12px] h-[2px] w-[24px] -translate-x-1/2 rounded-full bg-[#d6d9dc]" />

      <motion.div
        variants={sheetItem}
        className="absolute left-1/2 top-[71px] flex -translate-x-1/2 flex-col items-center gap-[12px] text-center"
      >
        <p className="whitespace-nowrap text-[24px] font-medium leading-[28px] tracking-[-0.96px] text-[#1a1a1a]">
          {stage === "verified" ? "Verified" : "Enter OTP"}
        </p>
        <p className="w-[214px] text-[16px] font-medium leading-[20px] tracking-[-0.64px] text-[#999]">
          {stage === "verified"
            ? "Taking you in"
            : "We\u2019ve sent a 6 digit OTP on your number"}
        </p>
      </motion.div>

      {/* --- the six, and the one they become ------------------------- */}
      <motion.div
        variants={sheetItem}
        className="absolute"
        style={{ left: ROW_LEFT, top: ROW_TOP, width: ROW_W, height: BOX_H }}
      >
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const isTop = i === TOP_CARD;
          // Once the deck is one, every card expands together, so the stack
          // stays a single shape rather than one card outgrowing the others.
          const w = ticked ? CHECK_SIZE : BOX_W;
          const h = ticked ? CHECK_SIZE : BOX_H;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: i * (BOX_W + GAP) + (BOX_W - w) / 2,
                top: (BOX_H - h) / 2,
                width: w,
                height: h,
                borderRadius: ticked ? 22 : 16,
                zIndex: depth(i),
                transform: gathered
                  ? `translate(${travel(i)}px, ${squared ? 0 : NUDGE[i]}px) rotate(${
                      squared ? 0 : SKEW[i]
                    }deg) scale(${stage === "check" ? 1 : 1})`
                  : "none",
                // Only the top card survives the squaring-up; the rest are
                // already underneath it, so you never see them go.
                opacity: squared && !isTop ? 0 : 1,
                filter:
                  squared && isTop
                    ? ticked
                      ? "drop-shadow(0 0 22px rgba(16,185,129,0.55)) drop-shadow(0 0 60px rgba(16,185,129,0.3))"
                      : "drop-shadow(0 8px 26px rgba(16,185,129,0.45))"
                    : "none",
                transition: [
                  `transform ${gathered && !squared ? glide(i) : 300}ms cubic-bezier(0.3,0.9,0.4,1)`,
                  "opacity 200ms ease",
                  "width 320ms cubic-bezier(0.22,1.2,0.36,1)",
                  "height 320ms cubic-bezier(0.22,1.2,0.36,1)",
                  "left 320ms cubic-bezier(0.22,1.2,0.36,1)",
                  "top 320ms cubic-bezier(0.22,1.2,0.36,1)",
                  "border-radius 320ms ease",
                  "filter 380ms ease",
                ].join(", "),
              }}
            >
              <OtpCard state={green ? "verified" : i < code.length ? "filled" : "empty"}>
                {i < code.length && (
                  <span
                    className="text-[22px] font-medium tracking-[-0.4px] text-[#1a1a1a] transition-opacity duration-200"
                    style={{ opacity: squared ? 0 : 1 }}
                  >
                    {code[i]}
                  </span>
                )}
              </OtpCard>

              {isTop && (
                <>
                  {/* the pulse that goes out as the tick lands */}
                  <span
                    className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-[1.5px] border-[#10b981]"
                    style={{
                      opacity: ticked ? 0 : 0,
                      animation: ticked ? "tick-pulse 620ms ease-out 180ms" : undefined,
                    }}
                  />
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="absolute left-1/2 top-1/2 z-20 h-[32px] w-[32px]"
                    style={{
                      transform: "translate(-50%, -50%)",
                      opacity: ticked ? 1 : 0,
                    }}
                  >
                    <path
                      d="M5 12.6 10 17.6 19.4 7.4"
                      stroke="#10b981"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      style={{
                        strokeDasharray: 1,
                        strokeDashoffset: ticked ? 0 : 1,
                        // Drawn, not faded: a tick that writes itself reads as
                        // something being confirmed rather than switched on.
                        transition: ticked
                          ? "stroke-dashoffset 420ms cubic-bezier(0.65,0,0.35,1) 140ms"
                          : "none",
                      }}
                    />
                  </svg>
                </>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* --- resend / verified ---------------------------------------- */}
      <motion.div
        variants={sheetItem}
        className="absolute left-1/2 top-[292px] flex h-[44px] -translate-x-1/2 items-center gap-[6px]"
      >
        {stage === "verified" ? (
          <p className="whitespace-nowrap text-[14px] font-semibold leading-[19px] tracking-[-0.14px] text-[#059669]">
            Verified successfully
          </p>
        ) : (
          <>
            <svg viewBox="0 0 16 16" fill="none" className="h-[14px] w-[14px]">
              <path
                d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13 2v3h-3"
                stroke="#ccc"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="whitespace-nowrap text-[14px] font-semibold leading-[19px] tracking-[-0.14px] text-[#ccc]">
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
            </p>
          </>
        )}
      </motion.div>

      {/* the perforated field the design puts at the foot of the sheet */}
      <Image
        src="/otp/union.svg"
        alt=""
        width={379}
        height={214}
        style={{ width: 379, height: 214 }}
        className="pointer-events-none absolute left-[30px] top-[389px] max-w-none"
      />
    </motion.div>
  );
}
