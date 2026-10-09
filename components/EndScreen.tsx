"use client";

import Image from "next/image";

/**
 * The home screen you land on once the OTP verifies (Figma 458:28187).
 *
 * The small glyphs are drawn inline rather than exported: they're standard
 * system icons, and inline SVG keeps them crisp at any scale instead of
 * shipping a dozen one-off files. The orbs reuse the sprites we already have.
 */
function Chip({ art, label }: { art: string; label: string }) {
  return (
    <button
      type="button"
      className="flex shrink-0 items-center gap-[6.7px] rounded-full border-[2.2px] border-white bg-[#fffffe] py-[9px] pl-[9px] pr-[18px] shadow-[0_4.3px_32px_-2.2px_rgba(0,0,0,0.05)]"
    >
      <Image
        src={art}
        alt=""
        width={27}
        height={27}
        style={{ width: 27, height: 27 }}
        className="rounded-full"
      />
      <span className="whitespace-nowrap text-[15.7px] font-medium leading-[21px] tracking-[-0.31px] text-black">
        {label}
      </span>
    </button>
  );
}

function HistoryRow({ label }: { label: string }) {
  return (
    <button type="button" className="flex w-full items-center justify-between px-[22.4px]">
      <span className="flex items-center gap-[9px]">
        <span className="flex h-[23px] w-[23px] items-center justify-center rounded-full border border-[#ececec] bg-[#f9fafb]">
          <svg viewBox="0 0 24 24" fill="none" className="h-[15px] w-[15px]">
            <path
              d="M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.2-5.7M3.5 4v3.5H7"
              stroke="#aaa"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="whitespace-nowrap text-[15.7px] font-medium leading-[21px] tracking-[-0.31px] text-[#999]">
          {label}
        </span>
      </span>
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="m9 5 7 7-7 7" stroke="#c9c9c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function EndScreen() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[44px] bg-white">
      {/* the soft wash the design lays under everything */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 8% 96%, rgba(255,214,170,0.55) 0%, rgba(255,235,214,0.22) 38%, rgba(255,255,255,0) 70%), radial-gradient(90% 55% at 95% 88%, rgba(214,226,255,0.5) 0%, rgba(255,255,255,0) 68%), radial-gradient(110% 60% at 50% 4%, rgba(236,240,250,0.8) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      {/* --- status bar ------------------------------------------------ */}
      <div className="absolute left-0 top-0 h-[66px] w-full">
        <div className="absolute left-1/2 top-[12.3px] h-[41.5px] w-[140px] -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
        <span className="absolute left-[25px] top-[20px] text-[18px] font-semibold tracking-[0.02px] text-black">
          12:30
        </span>
        <div className="absolute right-[25px] top-[24px] flex items-center gap-[6.7px]">
          <svg viewBox="0 0 20 14" fill="none" className="h-[13px] w-[20px]">
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={i * 5.2}
                y={10 - i * 3}
                width="3.4"
                height={3 + i * 3}
                rx="1"
                fill="#000"
                opacity={i === 3 ? 0.35 : 1}
              />
            ))}
          </svg>
          <svg viewBox="0 0 18 14" fill="none" className="h-[13px] w-[18px]">
            <path d="M1 5.2a11 11 0 0 1 16 0M3.8 8.3a7 7 0 0 1 10.4 0M9 12.2l2.1-2.3a3 3 0 0 0-4.2 0Z" stroke="#000" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
          <svg viewBox="0 0 27 14" fill="none" className="h-[13px] w-[27px]">
            <rect x="0.7" y="0.7" width="22" height="12.6" rx="4" stroke="#000" strokeOpacity="0.4" strokeWidth="1.2" />
            <rect x="2.4" y="2.4" width="18.6" height="9.2" rx="2.6" fill="#000" />
            <path d="M24.6 5v4a2.6 2.6 0 0 0 0-4Z" fill="#000" fillOpacity="0.45" />
          </svg>
        </div>
      </div>

      {/* --- menu ------------------------------------------------------- */}
      <button
        type="button"
        aria-label="Menu"
        className="absolute left-[22.4px] top-[75px] flex h-[53.9px] w-[53.9px] items-center justify-center rounded-[32px] border-[1.1px] border-[#e8e8e8] bg-white/20 shadow-[0_4.3px_32px_-1.9px_rgba(0,0,0,0.05)] backdrop-blur-sm"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[27px] w-[27px]">
          <path d="M4 8h16M4 16h16" stroke="#111" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>

      {/* --- the stack at the foot -------------------------------------- */}
      <div className="absolute bottom-0 left-0 flex w-full flex-col gap-[27px]">
        <div className="flex flex-col gap-[13.5px] px-[22.4px] py-[9px]">
          <Image
            src="/orbs/orb-9.png"
            alt=""
            width={43}
            height={43}
            style={{ width: 42.6, height: 42.6 }}
            className="rounded-full"
          />
          <p className="text-[26.9px] font-medium leading-[31.4px] tracking-[-1.08px] text-black">
            Afternoon, Mohak
          </p>
        </div>

        <div className="flex flex-col gap-[18px]">
          <HistoryRow label="Thailand visa rules" />
          <HistoryRow label="7 days itinerary in Thailand" />
        </div>

        <div className="flex flex-col items-center gap-[20px] px-[22.4px] pt-[13.5px]">
          <div className="flex w-full gap-[13.5px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]{display:none}">
            <Chip art="/orbs/orb-4.png" label="Order for me" />
            <Chip art="/orbs/orb-2.png" label="Negotiate for me" />
            <Chip art="/orbs/orb-6.png" label="Action suggestion" />
          </div>

          {/* input bar */}
          <div className="relative h-[62.8px] w-[396px] rounded-[30px] border-[1.1px] border-[#e8e8e8] bg-white/40 shadow-[0_4.3px_32px_-1.9px_rgba(0,0,0,0.05)] backdrop-blur-md">
            <div className="absolute left-[12.3px] top-[12.3px] flex items-center gap-[11.2px]">
              <span className="flex h-[35.9px] w-[35.9px] items-center justify-center rounded-full bg-black/5">
                <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
                  <path d="M12 5v14M5 12h14" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="flex h-[35.9px] w-[35.9px] items-center justify-center rounded-full border border-[#f2f2f2] bg-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-[17.5px] w-[17.5px]">
                  {[0, 1, 2].map((r) =>
                    [0, 1, 2].map((c) => (
                      <circle key={`${r}-${c}`} cx={6 + c * 6} cy={6 + r * 6} r="1.7" fill="#6f5bd0" />
                    )),
                  )}
                </svg>
              </span>
              <span className="whitespace-nowrap text-[18px] font-normal leading-[22.4px] tracking-[-0.72px] text-[#ccc]">
                Apply for a visa
              </span>
            </div>
            <div className="absolute right-[12.3px] top-[12.3px] flex items-center gap-[11.2px]">
              <span className="flex h-[35.9px] w-[35.9px] items-center justify-center rounded-full bg-black/5">
                <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]">
                  <path
                    d="M12 4a2.6 2.6 0 0 1 2.6 2.6v5a2.6 2.6 0 1 1-5.2 0v-5A2.6 2.6 0 0 1 12 4Zm6 7a6 6 0 0 1-12 0M12 17v3"
                    stroke="#111"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="flex h-[35.9px] w-[35.9px] items-center justify-center rounded-full bg-black">
                <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]">
                  <path d="M12 19V5M6 11l6-6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>

          {/* bottom nav */}
          <div className="flex h-[62.8px] w-[211px] items-center justify-between rounded-full border border-[#ededed] bg-white/70 px-[16px] shadow-[0_4.3px_32px_-2px_rgba(0,0,0,0.06)] backdrop-blur-md">
            <span className="flex h-[44.9px] w-[44.9px] items-center justify-center rounded-full border border-[#ededed] bg-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
                <path d="M21 3 3 10.5l7.5 3L13.5 21 21 3Z" stroke="#111" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex h-[44.9px] w-[44.9px] items-center justify-center rounded-full bg-black">
              <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]">
                <path d="M4 11 12 4l8 7v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8Z" fill="#fff" />
              </svg>
            </span>
            <Image
              src="/orbs/orb-10.png"
              alt=""
              width={45}
              height={45}
              style={{ width: 44.9, height: 44.9 }}
              className="rounded-full"
            />
          </div>
        </div>

        <div className="mx-auto mb-[8px] h-[5px] w-[148px] rounded-full bg-black" />
      </div>
    </div>
  );
}
