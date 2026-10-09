"use client";

import Image from "next/image";

/**
 * Country selector + phone number (Figma 458:27251).
 *
 * Deliberately NOT an <input>: tapping one would raise the OS keyboard, and
 * the design calls for the in-page number pad. The value is driven from
 * above and the caret is drawn.
 */
type Props = {
  value: string;
  focused: boolean;
  onFocus: () => void;
};

export function PhoneField({ value, focused, onFocus }: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-[12px]">
      <div className="flex w-full items-center gap-[6px]">
        <button
          type="button"
          className="flex h-[18px] w-[62px] shrink-0 items-center justify-center gap-[5px] p-[10px]"
          aria-label="Select country code, currently +91"
        >
          <Image
            src="/icons/flag.svg"
            alt=""
            width={14}
            height={14}
            style={{ width: 14, height: 14 }}
            className="shrink-0"
          />
          <span className="text-[14px] font-medium leading-[19px] tracking-[-0.28px] text-black">
            +91
          </span>
          <Image
            src="/icons/chevron.svg"
            alt=""
            width={5}
            height={8}
            style={{ width: 4.94, height: 8 }}
            className="shrink-0 rotate-90"
          />
        </button>

        <button
          type="button"
          onClick={onFocus}
          className="flex min-w-0 flex-1 items-center justify-start text-left text-[14px] font-medium leading-[19px] tracking-[-0.28px]"
          aria-label="Phone number"
        >
          {value ? (
            <span className="text-black">{value}</span>
          ) : (
            <span className="text-[#7a7a7a]">Enter number</span>
          )}
          {focused && (
            <span className="ml-[1px] inline-block h-[17px] w-[1.5px] animate-[caret_1.1s_steps(1,end)_infinite] bg-black align-middle" />
          )}
        </button>
      </div>
      <Image
        src="/icons/field-divider.svg"
        alt=""
        width={340.498}
        height={1}
        style={{ width: 340.498, height: 1 }}
      />
    </div>
  );
}
