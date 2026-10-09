/**
 * Orb cluster geometry, lifted from Figma node 458:27243.
 * Coordinates are in the 440 x 956 design frame; `left`/`top` are the
 * sprite's top-left corner so `transform` is free for motion only.
 *
 * The art comes from the shared library in the onboarding repo
 * (`public/assets/orbs`) — the same Figma family, exported at 400px with
 * this screen's colour grading already in it. Two of the thirteen (the
 * sunburst and the molecule) are not in that set, so those stay as 3x
 * exports of their own nodes.
 *
 * Every sprite has the page background baked into its corners, which is
 * why OrbCluster clips each one back to a circle.
 */

export type Orb = {
  id: string;
  /** what the orb depicts — the handle we use when tuning one of them */
  label: string;
  src: string;
  /** intrinsic pixel size of the source sprite */
  natural: number;
  /** The painted glass shell, drawn over the refracted body. This is the
   *  designed line work — the two intersecting lens arcs — and no amount of
   *  procedural fresnel reproduces it. */
  shell: string;
  /** where the shell sits, as fractions of the orb box. It overhangs on
   *  every side; these come from the design system's own glassBox. */
  shellBox: { left: number; top: number; width: number; height: number };
  /** top-left in design px */
  left: number;
  top: number;
  /** centre in design px — the collision solver works in centres */
  cx: number;
  cy: number;
  size: number;
  /** paint order — later sits on top, matching the Figma layer stack */
  z: number;
  /** 0..1 — how "close" the orb reads; drives parallax and drift amplitude */
  depth: number;
  /** per-orb drift signature so the cluster never moves in lockstep */
  drift: { fx: number; fy: number; px: number; py: number; ax: number; ay: number };
  /** rotation wobble: frequency, phase, amplitude in degrees */
  spin: { f: number; p: number; a: number };
  /** multiplier on how fast this orb reacts to shaking */
  tempo: number;
  /** the brand mark under the headline — alive, but it holds its place */
  anchored?: boolean;
  /** Where this orb goes once the keyboard is up (Figma frame 1250). Five
   *  of them regroup into a bigger, looser cluster; the rest fade out. */
  focus?: { cx: number; cy: number; size: number };
};

export const FRAME_WIDTH = 440;
export const FRAME_HEIGHT = 956;

/** largest orb in the cluster, used to normalize depth */
const MAX_SIZE = 102.947;

type Seed = {
  id: string;
  label: string;
  /** file in public/orbs, minus the extension */
  art: string;
  left: number;
  top: number;
  size: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  spinA: number;
  tempo: number;
  anchored?: boolean;
  focus?: { cx: number; cy: number; size: number };
};

const SEEDS: Seed[] = [
  { id: "27301", label: "caduceus", art: "orb-5", left: 88.033, top: 1.1, size: 75.494, ax: 7, ay: 5, fx: 0.62, fy: 0.88, spinA: 5, tempo: 1.05 },
  { id: "27302", label: "gear", art: "orb-6", left: 83.633, top: 78.09, size: 75.494, ax: 6, ay: 7, fx: 0.74, fy: 0.55, spinA: 6, tempo: 0.95 , focus: { cx: 140, cy: 76, size: 104 } },
  { id: "27303", label: "flag", art: "orb-7", left: 350.899, top: 0, size: 89.221, ax: 8, ay: 6, fx: 0.5, fy: 0.79, spinA: 4, tempo: 1.15 , focus: { cx: 108, cy: 186, size: 80 } },
  { id: "27304", label: "star", art: "orb-8", left: 174.92, top: 162.78, size: 89.221, ax: 7, ay: 8, fx: 0.86, fy: 0.46, spinA: 5, tempo: 1.2 },
  { id: "27305", label: "plane", art: "orb-10", left: 50.633, top: 148.48, size: 75.494, ax: 9, ay: 6, fx: 0.57, fy: 0.93, spinA: 7, tempo: 1.1 },
  { id: "27306", label: "coin", art: "orb-9", left: 4.441, top: 0, size: 82.358, ax: 6, ay: 5, fx: 0.69, fy: 0.61, spinA: 4, tempo: 0.9 },
  { id: "27307", label: "window", art: "orb-1", left: 156.225, top: 100.09, size: 68.631, ax: 8, ay: 7, fx: 0.95, fy: 0.72, spinA: 8, tempo: 1.25 , focus: { cx: 331, cy: 229, size: 82 } },
  { id: "27308", label: "globe", art: "orb-2", left: 163.927, top: 0, size: 102.947, ax: 5, ay: 6, fx: 0.44, fy: 0.67, spinA: 3, tempo: 0.85 , focus: { cx: 219, cy: 172, size: 143 } },
  { id: "27309", label: "pin", art: "orb-3", left: 267.311, top: 0, size: 82.358, ax: 7, ay: 5, fx: 0.81, fy: 0.5, spinA: 5, tempo: 1.0 },
  { id: "27310", label: "wine", art: "orb-4", left: 225.52, top: 87.99, size: 89.221, ax: 6, ay: 8, fx: 0.53, fy: 0.84, spinA: 6, tempo: 1.1 , focus: { cx: 362, cy: 140, size: 85 } },
  { id: "27321", label: "sunburst", art: "orb-sunburst", left: 7.74, top: 85.79, size: 74.79, ax: 9, ay: 7, fx: 0.66, fy: 0.97, spinA: 7, tempo: 1.3 },
  { id: "27329", label: "molecule", art: "orb-molecule", left: 312.4, top: 76.99, size: 74.79, ax: 8, ay: 6, fx: 0.9, fy: 0.58, spinA: 6, tempo: 1.2 },
  // brand mark above the headline
  { id: "27300", label: "mark", art: "orb-7", left: 194, top: 381, size: 52, ax: 2.5, ay: 2, fx: 0.48, fy: 0.72, spinA: 2, tempo: 0.6, anchored: true, focus: { cx: 220, cy: 407, size: 52 } },
];

/** Shell placement, as fractions of the orb box (the source numbers are
 *  written against a 200-unit frame). */
const SHELL_BOX: Record<string, { left: number; top: number; width: number; height: number }> = {
  "orb-1": { left: -0.055300, top: -0.072207, width: 1.106492, height: 1.139831 },
  "orb-2": { left: -0.054446, top: -0.072207, width: 1.054943, height: 1.139831 },
  "orb-3": { left: -0.053588, top: -0.072207, width: 1.106491, height: 1.139831 },
  "orb-4": { left: -0.057588, top: -0.072207, width: 1.106491, height: 1.139831 },
  "orb-5": { left: -0.055297, top: -0.072207, width: 1.106492, height: 1.139831 },
  "orb-6": { left: -0.055297, top: -0.072207, width: 1.106492, height: 1.139833 },
  "orb-7": { left: -0.055297, top: -0.072207, width: 1.106491, height: 1.139833 },
  "orb-8": { left: -0.055297, top: -0.072207, width: 1.106492, height: 1.139833 },
  "orb-9": { left: -0.055297, top: -0.072207, width: 1.106492, height: 1.139833 },
  "orb-10": { left: -0.055297, top: -0.072207, width: 1.106492, height: 1.139833 },
  "orb-sunburst": { left: -0.055300, top: -0.072200, width: 1.106500, height: 1.139850 },
  "orb-molecule": { left: -0.055300, top: -0.072200, width: 1.106500, height: 1.139850 },
};

/** Deterministic 0..1 from the orb id, so phases are stable across renders. */
function hashPhase(id: string, salt: number) {
  let h = salt * 2654435761;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 1000) / 1000) * Math.PI * 2;
}

export const ORBS: Orb[] = SEEDS.map((s, i) => ({
  id: s.id,
  label: s.label,
  src: `/orbs/${s.art}.png`,
  natural: /^orb-\d+$/.test(s.art) ? 400 : 225,
  shell: `/orbs/${s.art}-glass.svg`,
  shellBox: SHELL_BOX[s.art],
  left: s.left,
  top: s.top,
  cx: s.left + s.size / 2,
  cy: s.top + s.size / 2,
  size: s.size,
  // SEEDS is authored in Figma layer order; the anchored mark sits last but lowest
  z: s.anchored ? 0 : i + 1,
  depth: s.size / MAX_SIZE,
  drift: {
    fx: s.fx,
    fy: s.fy,
    px: hashPhase(s.id, 1),
    py: hashPhase(s.id, 2),
    ax: s.ax,
    ay: s.ay,
  },
  spin: { f: s.fx * 0.7, p: hashPhase(s.id, 3), a: s.spinA },
  tempo: s.tempo,
  anchored: s.anchored,
  focus: s.focus,
}));
