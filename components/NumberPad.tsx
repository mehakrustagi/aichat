"use client";

import { haptic } from "@/lib/haptics";

/**
 * The iOS number pad, from Figma 458:20333.
 *
 * Geometry is lifted straight from the node: the pad is 440x308 and sits at
 * y=648 in the 440x956 frame. Rows are 48 tall at y 24/78/132/186, and the
 * three columns are 137.554 wide at x 0/143.554/287.109 inside a 7.667 inset.
 */
export const PAD_HEIGHT = 308;
export const PAD_TOP = 648;

const ROW_Y = [24, 78, 132, 186];
const COL_X = [0, 143.554, 287.109];
const INSET = 7.667;
const KEY_W = 137.554;
const KEY_H = 48;

type Key = { digit: string; letters?: string };

const ROWS: (Key | null)[][] = [
  [{ digit: "1" }, { digit: "2", letters: "ABC" }, { digit: "3", letters: "DEF" }],
  [
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
  ],
  [
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
  ],
  // the first slot is the blank iOS leaves beside the zero
  [null, { digit: "0" }, { digit: "del" }],
];

function DeleteGlyph() {
  return (
    <svg width="27" height="19" viewBox="0 0 27 19" fill="none" aria-hidden>
      <path
        d="M8.2 1.5h15.3A2.5 2.5 0 0 1 26 4v11a2.5 2.5 0 0 1-2.5 2.5H8.2a2.5 2.5 0 0 1-1.8-.78L1.3 10.2a1 1 0 0 1 0-1.4l5.1-6.52A2.5 2.5 0 0 1 8.2 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m12 6.6 6.4 5.8M18.4 6.6 12 12.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Props = {
  onDigit: (d: string) => void;
  onDelete: () => void;
  /** slides the pad off the bottom when the field isn't focused */
  open: boolean;
};

export function NumberPad({ onDigit, onDelete, open }: Props) {
  return (
    <div
      className="absolute left-0 w-[440px] bg-[#dde1e6] transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        top: PAD_TOP,
        height: PAD_HEIGHT,
        transform: open ? "translateY(0)" : `translateY(${PAD_HEIGHT}px)`,
      }}
      aria-hidden={!open}
    >
      {ROWS.map((row, r) =>
        row.map((key, c) => {
          if (!key) return null;
          const isDelete = key.digit === "del";
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              tabIndex={open ? 0 : -1}
              aria-label={isDelete ? "Delete" : key.digit}
              onPointerDown={() => {
                haptic(isDelete ? "erase" : "key");
                if (isDelete) onDelete();
                else onDigit(key.digit);
              }}
              className="absolute flex select-none flex-col items-center justify-center rounded-[10px] bg-white text-black shadow-[0_1px_1px_rgba(0,0,0,0.08)] transition-colors duration-75 active:bg-[#e6e9ee]"
              style={{
                left: INSET + COL_X[c],
                top: ROW_Y[r],
                width: KEY_W,
                height: KEY_H,
              }}
            >
              {isDelete ? (
                <DeleteGlyph />
              ) : (
                <>
                  <span className="text-[25px] leading-[28px] font-normal tracking-[0.2px]">
                    {key.digit}
                  </span>
                  {key.letters && (
                    <span className="text-[10px] leading-[11px] font-medium tracking-[1.6px]">
                      {key.letters}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}
