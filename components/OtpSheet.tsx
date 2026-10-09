"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { OtpCard } from "@/components/OtpCard";
import { RollingTitle } from "@/components/motion/RollingTitle";
import { VerifiedTick } from "@/components/motion/VerifiedTick";
import { SheetFootField } from "@/components/motion/SheetFootField";
import { PAD_HEIGHT } from "@/components/NumberPad";
import { sheetItem, sheetVariants } from "@/lib/sheetMotion";
import { haptic } from "@/lib/haptics";
import { FRAME_HEIGHT } from "@/lib/orbs";

export const OTP_LENGTH = 6;
/** The sheet runs to the foot of the screen and the number pad lives inside
 *  it, so the two read as one surface rather than a card sitting on a slab. */
export const SHEET_TOP = 208;
export const SHEET_HEIGHT = FRAME_HEIGHT - SHEET_TOP;
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
  ["check", 1080],
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

/** The size the single card settles at, reached by scaling rather than by
 *  resizing — see the card's transform. */
const CHECK_SIZE = 66;
/* 50x58 to 66x66 is not a uniform scale, and doing it with `transform` put a
   16% horizontal stretch through everything inside: the tick came out wider
   than it was tall, the corner radius went elliptical, and the 1px border
   became 1.32px on the sides against 1.14px top and bottom. By the time this
   runs the other five cards are unmounted, so growing the box itself is one
   element's layout for 320ms — which buys back a tick that is the shape it
   was drawn. */

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
      className="absolute left-0 w-[440px] overflow-hidden rounded-t-[44px] bg-white shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.12)]"
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
        className="absolute left-1/2 top-[71px] flex w-[300px] -translate-x-1/2 flex-col items-center gap-[12px] text-center"
      >
        {/* Turns over when the code resolves, rather than swapping. */}
        <RollingTitle
          title={stage === "verified" ? "Verified" : "Enter OTP"}
          tone={stage === "verified" ? "success" : "ink"}
          height={28}
          align="center"
          className="text-[24px] font-medium leading-[28px] tracking-[-0.96px]"
        />
        <div className="w-[214px]">
          <RollingTitle
            title={
              stage === "verified"
                ? "Taking you in"
                : "We\u2019ve sent a 6 digit OTP on your number"
            }
            tone="grey"
            height={40}
            align="center"
            className="text-[16px] font-medium leading-[20px] tracking-[-0.64px] whitespace-normal text-center"
          />
        </div>
      </motion.div>

      {/* --- the six, and the one they become ------------------------- */}
      <motion.div
        variants={sheetItem}
        className="absolute"
        style={{ left: ROW_LEFT, top: ROW_TOP, width: ROW_W, height: BOX_H }}
      >
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const isTop = i === TOP_CARD;
          // Hidden cards stop rendering entirely rather than sitting at zero
          // opacity: each one runs a conic-gradient lining, and five of those
          // still animating under the one you can see is what made the last
          // beat stutter.
          const gone = squared && !isTop;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: i * (BOX_W + GAP) + (BOX_W - (ticked ? CHECK_SIZE : BOX_W)) / 2,
                top: (BOX_H - (ticked ? CHECK_SIZE : BOX_H)) / 2,
                width: ticked ? CHECK_SIZE : BOX_W,
                height: ticked ? CHECK_SIZE : BOX_H,
                borderRadius: ticked ? 22 : 16,
                zIndex: depth(i),
                // The box never changes size. Growing it by width/height would
                // put a layout pass in every frame of the one moment that has
                // to be perfect; a non-uniform scale is composited instead.
                transform: gathered
                  ? `translate(${travel(i)}px, ${squared ? 0 : NUDGE[i]}px) rotate(${
                      squared ? 0 : SKEW[i]
                    }deg)`
                  : "none",
                opacity: gone ? 0 : 1,
                transition: [
                  gathered && !squared
                    ? `transform ${glide(i)}ms cubic-bezier(0.3,0.9,0.4,1)`
                    : "transform 360ms cubic-bezier(0.34,1.28,0.5,1)",
                  "opacity 180ms ease",
                  "width 320ms cubic-bezier(0.34,1.28,0.5,1)",
                  "height 320ms cubic-bezier(0.34,1.28,0.5,1)",
                  "left 320ms cubic-bezier(0.34,1.28,0.5,1)",
                  "top 320ms cubic-bezier(0.34,1.28,0.5,1)",
                  "border-radius 300ms ease",
                ].join(", "),
              }}
            >
              {!gone && (
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
              )}

              {isTop && (
                <>
                  {/* Both of these live on the card rather than on the row.
                      Pinned to the row they sat at the card's FINAL geometry
                      while it was still growing into it, so for the whole
                      320ms the glow and the ring were offset from the thing
                      they belong to. */}
                  <span
                    className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-[420ms]"
                    style={{
                      opacity: squared ? 1 : 0,
                      boxShadow: ticked
                        ? "0 0 26px 2px rgba(16,185,129,0.5), 0 0 70px 12px rgba(16,185,129,0.26)"
                        : "0 10px 30px -4px rgba(16,185,129,0.45)",
                    }}
                  />
                  {ticked && (
                    <span
                      className="pointer-events-none absolute inset-0 rounded-[inherit] border-[1.5px] border-[#10b981]"
                      style={{
                        opacity: 0,
                        animation: "tick-pulse 640ms cubic-bezier(0.22,1,0.36,1) 180ms",
                      }}
                    />
                  )}
                  <VerifiedTick
                    on={ticked}
                    size={30}
                    className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
                  />
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
          <p className="whitespace-nowrap text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-[#059669]">
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

      <SheetFootField bottom={PAD_HEIGHT} rows={4} />

    </motion.div>
  );
}
