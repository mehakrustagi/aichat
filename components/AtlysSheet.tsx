"use client";

import Image from "next/image";
import { motion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { LiquidPill } from "@/components/motion/LiquidPill";
import { StepIcon, STEP_TEXT_GRADIENT } from "@/components/motion/StepIcon";
import { VerifiedTick } from "@/components/motion/VerifiedTick";
import { LoaderCore } from "@/components/ui/multi-step-loader";
import { sheetItem, sheetVariants } from "@/lib/sheetMotion";
import { DocumentStack, STACK_W } from "@/components/motion/DocumentStack";
import { DotShimmer } from "@/components/motion/DotShimmer";
import { RollingTitle } from "@/components/motion/RollingTitle";
import { SheetFootField } from "@/components/motion/SheetFootField";
import { ConnectDots } from "@/components/motion/ConnectDots";
import { haptic } from "@/lib/haptics";

export const ATLYS_SHEET_HEIGHT = 680;
/** The failure state has no card, no steps and no CTA, so the sheet comes
 *  down to meet it rather than leaving two thirds of itself empty. */
const FAILED_HEIGHT = 400;
/** Steps start at y350 and a row is 26 tall on an 18 gap, so one row clears
 *  at 376 and two at 420. The frame below each gets room, not an average. */
/** Stages with nothing under the copy bring the sheet down to meet them,
 *  rather than leaving two thirds of it empty under a single line. */
const CONNECTED_HEIGHT = 430;
const CARD_TOP_ONE_ROW = 410;
const CARD_TOP_TWO_ROWS = 456;

/**
 * Signing in through an existing Atlys account (Figma 458:20558 →
 * 458:23555 → 458:24053 → 458:24470).
 *
 * The first two stages run themselves — they're a progress narrative, not a
 * decision — then it waits on "Access via Atlys" before the handshake lands.
 */
type Stage = "connecting" | "profile" | "confirm" | "connected" | "failed";

/** ms each self-advancing stage holds before the next */
const HOLD = { connecting: 3600, profile: 3600, connected: 2600 } as const;
/** When the first step stops searching and lands, partway through stage one —
 *  the node draws it already green with the visas underneath it. */
const FIRST_DONE_MS = 1900;

/** The stamp's box, and how wide its printed mount is. A narrow mount makes
 *  the art look trimmed to the edge; this is what puts the perforations a
 *  long way from anything you are meant to look at. */
/* The perforation is Figma's own boolean path (458:20997), exported and used
   as a mask. Rebuilding it from CSS gradient layers was close but never bit
   the edge — this is the designed silhouette, at the size the node is drawn:
   64.6875 x 72. */
const STAMP_W = 64.6875;
const STAMP_H = 72;
const MOUNT = 5;
const STAMP_MASK = {
  maskImage: "url(/atlys/stamp.svg)",
  maskSize: "100% 100%",
  maskRepeat: "no-repeat",
  maskMode: "alpha",
  WebkitMaskImage: "url(/atlys/stamp.svg)",
  WebkitMaskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
} as const;

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

/**
 * The two things the agent does, as Aceternity's MultiStepLoader.
 *
 * Only `LoaderCore` is used: the exported component wraps it in a fixed
 * full-screen backdrop, which is the wrong shape inside a bottom sheet. The
 * scroll is off because both steps are on screen at once — it exists for long
 * lists showing one step at a time.
 *
 * The accents are ours. The loader marks the active step by colour, and the
 * design already gives each line its own: warm for the visas, green for the
 * profile.
 */
const STEP_LABELS = ["Retrieving your visas", "Collecting your profile data"];

/**
 * A step's copy, painted in the spectrum that matches its state and rolled
 * over when that state changes — searching is the four-stop working gradient,
 * done is black falling to green. The drum is keyed on the state, so
 * finishing turns the line over rather than recolouring it in place.
 */
function stepText(label: string, done: boolean) {
  return (
    // The loader wraps this in an inline span, and the drum positions every
    // face absolutely — without a width of its own it collapses and clips
    // them away. Same trap as the sheet titles.
    <span key={label} className="block w-[280px]">
      <RollingTitle title={`${label}|${done ? "done" : "live"}`} height={20}>
      <span
        className="whitespace-nowrap bg-clip-text text-[16px] font-medium leading-[20px] tracking-[-0.3px] text-transparent"
        style={{ backgroundImage: done ? STEP_TEXT_GRADIENT.done : STEP_TEXT_GRADIENT.live }}
      >
          {label}
        </span>
      </RollingTitle>
    </span>
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
  const [firstDone, setFirstDone] = useState(false);
  const timers = useRef<number[]>([]);

  // Reset and run the opening narrative each time the sheet comes up.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restarts the narrative each time the sheet opens
    setStage("connecting");
    setFirstDone(false);
    timers.current = [
      window.setTimeout(() => setFirstDone(true), FIRST_DONE_MS),
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
  const failed = stage === "failed";
  /* A CSS transition cannot do this: `motion` owns this element's style, so
     the height was being written straight through and snapping while
     everything around it eased — which is what made one sheet resizing read
     as a different sheet arriving. A spring on the value settles it with the
     same character as the sheet's own entrance. */
  const sheetHeight = failed
    ? FAILED_HEIGHT
    : connected
      ? CONNECTED_HEIGHT
      : ATLYS_SHEET_HEIGHT;
  const height = useSpring(sheetHeight, { stiffness: 230, damping: 32, mass: 0.9 });
  useEffect(() => {
    height.set(sheetHeight);
  }, [height, sheetHeight]);
  /** How many rows are on screen, and the index of the last completed one. */
  const rows = stage === "connecting" ? 1 : 2;
  const done = stage === "connecting" ? (firstDone ? 0 : -1) : 0;

  return (
    <motion.div
      className="absolute bottom-0 left-0 w-[440px] overflow-hidden rounded-t-[44px] bg-white shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.12)]"
      animate={open ? "visible" : "hidden"}
      style={{ height, transformPerspective: 1400 }}
      variants={sheetVariants}
      custom={sheetHeight + 40}
      initial="hidden"
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
          <div
            className="transition-opacity duration-300"
            style={{ opacity: connected || failed ? 0 : 1 }}
          >
            <ConnectDots />
          </div>
          <div
            className="absolute transition-all duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ opacity: connected ? 1 : 0, transform: `scale(${connected ? 1 : 0.6})` }}
          >
            <Tile className="bg-[#e9f7f0]">
              <span className="relative flex h-[40px] w-[40px] items-center justify-center">
                <span className="absolute inset-0 rounded-full border-[1.9px] border-[#0d9b63]" />
                <VerifiedTick on={connected} size={24} color="#0d9b63" weight={2.4} delay={0.26} />
              </span>
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
        {/* Both lines ride the same drum, so a stage change turns them over
            rather than swapping them out. */}
        <RollingTitle
          title={failed ? "failed" : stage === "confirm" ? "confirm" : connected ? "connected" : "connecting"}
          height={28}
          align="center"
        >
          <span className="whitespace-nowrap text-[24px] font-medium leading-[28px] tracking-[-0.96px] text-[#0b0b0b]">
            {failed ? (
              <>
                We{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #F0A04B 0%, #EF6C45 52%, #F2B544 100%)",
                  }}
                >
                  couldn&rsquo;t connect
                </span>
              </>
            ) : stage === "confirm" ? (
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
          </span>
        </RollingTitle>

        <RollingTitle
          title={
            failed
              ? "Download Atlys app and login to access Hermes"
              : stage === "confirm"
              ? "Verify your Atlys account now!"
              : connected
                ? "Welcome to Hermes"
                : "Starting secure communication"
          }
          tone="grey"
          height={20}
          align="center"
          className="whitespace-nowrap text-[16px] font-medium leading-[20px] tracking-[-0.64px]"
        />
      </motion.div>

      {/* --- progress ------------------------------------------------- */}
      <motion.div
        variants={sheetItem}
        className="absolute left-[40px] top-[350px] w-[360px] transition-opacity duration-300"
      >
        {/* The gate lives on an inner element: `sheetItem` animates opacity
            on the wrapper, and a motion-driven value beats the style prop —
            so gating the wrapper did nothing and the steps stayed up through
            the failure state. */}
        <div
          className="transition-opacity duration-300"
          style={{ opacity: working ? 1 : 0, pointerEvents: working ? "auto" : "none" }}
        >
        {/* A step appears when it starts, so the finished one sits above the
            working one rather than being scrolled away — that is what the
            node draws. The lift is the drum: completing re-keys the line, so
            it rolls up and out and comes back in its finished colours while
            the next row arrives underneath. */}
        <LoaderCore
          loadingStates={STEP_LABELS.slice(0, rows).map((label, i) => ({
            text: stepText(label, i <= done),
          }))}
          value={done}
          scroll={false}
          className="mx-0 mt-0 max-w-none [&>div]:mb-[18px] [&>div]:items-center [&>div]:gap-[12px]"
          renderDone={() => <StepIcon done />}
          renderPending={() => <StepIcon done={false} />}
        />
        </div>
      </motion.div>

      {/* --- what is being retrieved ---------------------------------- */}
      <div
        className="absolute left-[45px] h-[158px] w-[350px] overflow-hidden rounded-[20px] bg-white shadow-[0_8px_36px_-10px_rgba(0,0,0,0.14)] transition-all duration-[420ms]"
        style={{
          // One step row in this stage, two in the next, so the frame sits
          // where the rows leave off instead of under the worst case.
          top: CARD_TOP_ONE_ROW,
          opacity: stage === "connecting" ? 1 : 0,
          transform: `translateY(${stage === "connecting" ? 0 : 12}px)`,
        }}
      >
        <div className="px-[18px] pt-[16px]">
          <DotShimmer rows={2} width={300} />
        </div>
        {/* stage one shows the visas themselves; stage two is still loading */}
        <div
          // Centred in the card, and overlapping — the node fans them so each
          // one sits partly over the next, which is what makes it read as a
          // handful of stamps rather than a row of them.
          className="absolute inset-0 flex items-center justify-center px-[16px] pt-[14px] transition-opacity duration-500"
        >
          {POSTCARDS.map((c, i) => (
            /* Two elements, and the split matters: `filter` is applied BEFORE
               `mask`, so a drop-shadow on the masked element is a shadow of
               the un-masked square. The wrapper carries the shadow and sees
               the already-perforated child, which is what traces the notches
               — and tracing them is the only way they read, since the mount
               is white on a white card. */
            <div
              key={c.src}
              className="shrink-0 [filter:drop-shadow(0_0.5px_0.6px_rgba(0,0,0,0.3))_drop-shadow(0_4px_9px_rgba(0,0,0,0.12))]"
              style={{ transform: `rotate(${c.rotate}deg)`, marginLeft: i === 0 ? 0 : -7 }}
            >
              <div style={{ width: STAMP_W, height: STAMP_H, background: "#fff", ...STAMP_MASK }}>
                <Image
                  src={c.src}
                  alt=""
                  width={60}
                  height={82}
                  style={{
                    width: STAMP_W - MOUNT * 2,
                    height: STAMP_H - MOUNT * 2,
                    margin: MOUNT,
                  }}
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Still being read: the stack the vault uses for a document it has
          not finished with. Replaces the card entirely for this stage —
          Figma 458:28426 draws it as its own object, not as card contents. */}
      <div
        className="absolute left-1/2 transition-all duration-[420ms]"
        style={{
          top: CARD_TOP_TWO_ROWS,
          width: STACK_W,
          marginLeft: -STACK_W / 2,
          opacity: stage === "profile" ? 1 : 0,
          transform: `translateY(${stage === "profile" ? 0 : 12}px)`,
        }}
      >
        <DocumentStack />
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

        <LiquidPill onTap={accept} className="mt-[46px]" ariaLabel="Access via Atlys">
          <span className="text-[14px] font-semibold tracking-[-0.14px] text-black">
            Access via Atlys
          </span>
        </LiquidPill>

        {/* Guessed trigger: the design gives no path into the failure state,
            and this is the only other action on the screen. Choosing another
            account means reaching the Atlys app, and the failure copy is
            literally "Download Atlys app" — so it is at least coherent. One
            line to point somewhere else. */}
        <button
          type="button"
          onClick={() => setStage("failed")}
          className="mt-[26px] text-[14px] font-medium tracking-[-0.28px] text-[#1a1a1a] underline underline-offset-[3px]"
        >
          Log in to another account
        </button>
      </div>

      <SheetFootField rows={7} />

    </motion.div>
  );
}
