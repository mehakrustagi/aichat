"use client";

import { useCallback, useState } from "react";
import { useDeviceMotion } from "@/hooks/useDeviceMotion";
import { AtlysButton } from "@/components/AtlysButton";
import { AtlysSheet } from "@/components/AtlysSheet";
import { DesignFrame } from "@/components/DesignFrame";
import { EndScreen } from "@/components/EndScreen";
import { NumberPad } from "@/components/NumberPad";
import { OrbCluster } from "@/components/OrbCluster";
import { OtpSheet, OTP_LENGTH } from "@/components/OtpSheet";
import { PhoneField } from "@/components/PhoneField";
import { SocialRow } from "@/components/SocialRow";
import { haptic } from "@/lib/haptics";

/**
 * The sign-in flow.
 *
 *   idle      the screen at rest (Figma 1255)
 *   entering  phone field focused: the stack lifts, the orbs regroup and
 *             the number pad comes up (1251 empty / 1250 filled)
 *   otp       the OTP sheet is up, the same pad now feeds it (1991431406)
 *   end       verified, and we are through to the home screen (458:28187)
 */
type Phase = "idle" | "entering" | "otp" | "atlys" | "end";

const PHONE_LENGTH = 10;
/** Every element in the stack moves by exactly this when the pad comes up. */
const FOCUS_LIFT = 76;

export function LoginScreen() {
  const { motion, needsPermission, request } = useDeviceMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const focused = phase === "entering" || phase === "otp";
  const lift = focused ? FOCUS_LIFT : 0;
  const ready = phone.length === PHONE_LENGTH;

  const onDigit = useCallback(
    (d: string) => {
      if (phase === "otp") {
        setCode((c) => (c.length < OTP_LENGTH ? c + d : c));
      } else {
        setPhone((p) => (p.length < PHONE_LENGTH ? p + d : p));
      }
    },
    [phase],
  );

  const onDelete = useCallback(() => {
    if (phase === "otp") setCode((c) => c.slice(0, -1));
    else setPhone((p) => p.slice(0, -1));
  }, [phase]);

  const toOtp = () => {
    if (!ready) return;
    haptic("commit");
    setPhase("otp");
  };

  if (phase === "end") {
    return (
      <DesignFrame>
        <EndScreen />
      </DesignFrame>
    );
  }

  return (
    <DesignFrame>
      <OrbCluster
        motion={motion}
        className="absolute left-0 top-0 z-0"
        offsetY={-lift}
        focus={focused ? 1 : 0}
      />

      <div className="relative z-10 h-full w-full">
        {needsPermission && (
          <button
            type="button"
            onClick={request}
            className="absolute left-1/2 top-[316px] z-20 -translate-x-1/2 rounded-full border border-[#d6d9dc] bg-white/80 px-[14px] py-[7px] text-[11px] font-bold uppercase tracking-[0.88px] text-[#1a1a1a] backdrop-blur-sm"
          >
            Tap to let the orbs follow you
          </button>
        )}

        {/* Everything in the stack lifts together — the design moves each of
            these by the same 76px between frames 1255 and 1250. */}
        <div
          className="absolute inset-0 transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateY(${-lift}px)` }}
        >
          <h1 className="absolute left-1/2 top-[453px] flex w-[216px] -translate-x-1/2 items-start justify-center gap-[4px] whitespace-nowrap text-center text-[24px] font-medium leading-[28px] tracking-[-0.96px] text-[#0b0b0b]">
            <span>Welcome to</span>
            <span
              className="bg-clip-text transition-colors duration-300"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(0,0,0) 0%, rgb(80,87,234) 33%, rgb(239,70,70) 66%, rgb(237,215,88) 99%)",
                color: focused ? "transparent" : "#0b0b0b",
              }}
            >
              Hermes
            </span>
          </h1>

          <p className="absolute left-1/2 top-[497px] w-[258px] -translate-x-1/2 text-center text-[14px] font-medium leading-[19px] tracking-[-0.28px] text-[#6d6d6d]">
            Sign in to secure your profile and automate your global travel
          </p>

          <div className="absolute left-[49px] top-[567px] flex w-[340.498px] flex-col items-end gap-[48px]">
            <div className="flex w-full flex-col items-center justify-center gap-[32px]">
              <PhoneField
                value={phone}
                focused={phase === "entering"}
                onFocus={() => setPhase("entering")}
              />
              {/* the design fades these out rather than removing them, so the
                  field keeps its position in the stack */}
              <div
                className="flex w-full flex-col items-center gap-[32px] transition-opacity duration-200"
                style={{ opacity: focused ? 0 : 1, pointerEvents: focused ? "none" : "auto" }}
              >
                <p className="w-full text-center text-[11px] font-bold uppercase leading-[14px] tracking-[0.88px] text-[#1a1a1a]">
                  OR
                </p>
                <AtlysButton onClick={() => setPhase("atlys")} />
              </div>
            </div>
            <div
              className="w-full transition-opacity duration-200"
              style={{ opacity: focused ? 0 : 1, pointerEvents: focused ? "none" : "auto" }}
            >
              <SocialRow />
            </div>
          </div>
        </div>

        {/* --- Continue (Figma 458:20334) ----------------------------- */}
        <button
          type="button"
          onClick={toOtp}
          disabled={!ready}
          className="absolute h-[48px] w-[380px] rounded-[30px] text-[16px] font-semibold leading-[20px] tracking-[-0.64px] transition-all duration-[300ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            left: "calc(50% + 11px)",
            top: 584,
            transform: `translateX(-50%) translateY(${phase === "entering" ? 0 : 24}px)`,
            opacity: phase === "entering" ? 1 : 0,
            pointerEvents: phase === "entering" ? "auto" : "none",
            background: ready ? "#000" : "#d9d9d9",
            color: ready ? "#d9d9d9" : "#8d8d8d",
          }}
        >
          Continue
        </button>

        <OtpSheet
          code={code}
          open={phase === "otp"}
          onDone={() => setPhase("end")}
        />

        <AtlysSheet
          open={phase === "atlys"}
          onDone={() => setPhase("end")}
          onDismiss={() => setPhase("idle")}
        />

        <NumberPad onDigit={onDigit} onDelete={onDelete} open={focused} />

        {/* Home indicator */}
        <div className="absolute bottom-[8px] left-1/2 z-20 h-[5px] w-[148px] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </DesignFrame>
  );
}
