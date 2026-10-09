/**
 * The glass model, parameter for parameter.
 *
 * Three stacked models, each switchable, because they answer different
 * questions about the same sphere:
 *   - `glass`         — what the surface does to the light passing through
 *   - `physical`      — the shell as a real refracting solid with a wall
 *   - `solid`         — the "painted lens" read: colour carried in the glass
 *                       itself, light bouncing around inside it
 *
 * Values are the defaults from the reference panel. Everything is 0..1
 * unless noted, so a slider can drive it without remembering ranges.
 */
export type OrbGlass = {
  // --- Glass ---------------------------------------------------------
  /** scene colour behind the orbs */
  background: string;
  /** how far into the art we sample. Lower = the subject sits deeper and smaller. */
  centreZoom: number;
  /** how hard the rim bends what is behind it */
  edgeBend: number;
  /** red and blue split as they refract — tiny values only */
  chromatic: number;
  /** frosted softness in the shell */
  rimHaze: number;
  /** the thin bright line around the edge */
  rimLine: number;
  /** the tight specular where the light source lands */
  highlight: number;
  /** the broad reflected window */
  gloss: number;
  /** one window, or a window and its weaker partner opposite */
  glossShape: "single" | "dual";
  glossSize: number;
  /** the colour the glass itself carries */
  tint: string;
  /** how far the contents shift against the shell as the phone turns */
  parallax: number;
  /** the painted glass shell over the refracted body — the designed line
   *  work, which no procedural rim reproduces */
  shellOpacity: number;
  /** multiplier on the idle drift */
  float: number;
  /** multiplier on the rotational wobble */
  wobble: number;

  // --- Physical glass ------------------------------------------------
  physicalOn: boolean;
  /** index of refraction. 1.0 is a flat sticker, 1.45 is glass, 2.4 is diamond. */
  ior: number;
  /** how much of the radius is shell rather than contents */
  wallThickness: number;
  /** how far behind the front surface the art hangs */
  imageDepth: number;
  /** how strongly the tint stains what you see through it */
  glassTint: number;
  /** master on the reflected room */
  reflections: number;

  // --- Solid glass (painted lens) ------------------------------------
  solidOn: boolean;
  /** how much of the art's own colour bleeds into the rim */
  rimColourDepth: number;
  /** light bouncing back off the inside of the far wall */
  innerReflections: number;
  /** the secondary highlights the painted read adds */
  highlights: number;
  /** glow from within the body */
  innerGlow: number;
  /** contact shadow cast below */
  floorShadow: number;
  /** the bright focused spot a lens throws below itself */
  floorCaustic: number;

  // --- Motion --------------------------------------------------------
  /** how much faster they swim when the phone is shaken */
  shakeSpeed: number;
  /** how much further they swing when shaken */
  shakeAmount: number;
  /** how hard the phone's own acceleration throws them */
  throwForce: number;
  /** how far they may wander from home before a soft wall pulls back */
  roam: number;
  /** how hard they shove each other apart on contact */
  repel: number;
  /** travel at full tilt, px, for the frontmost orb */
  tiltTravel: number;
  /** spring back to home. Lower = looser, laggier, more overshoot. */
  spring: number;
  /** drag. Below ~2*sqrt(spring) they overshoot and glide. */
  drag: number;
};

export const ORB_GLASS_DEFAULTS: OrbGlass = {
  background: "#ffffff",
  // The reference panel ran 0.72 / 0.55 / 0.012. Our art is a painted glass
  // bead rather than a flat image, so at those values the subject magnifies
  // until it fills the sphere and the shell disappears. Pulled back until
  // the contents sit at roughly their painted size — the sliders put the
  // original numbers back in one drag.
  centreZoom: 0.80,
  edgeBend: 0.32,
  chromatic: 0.006,
  rimHaze: 0.35,
  rimLine: 0.55,
  highlight: 0,
  gloss: 0.45,
  glossShape: "dual",
  glossSize: 0.87,
  tint: "#bcd7ff",
  parallax: 0.1,
  shellOpacity: 0.95,
  float: 1,
  wobble: 1,

  physicalOn: true,
  ior: 1.45,
  wallThickness: 0.07,
  imageDepth: 0,
  glassTint: 0.25,
  reflections: 1,

  solidOn: true,
  rimColourDepth: 0.55,
  innerReflections: 0.7,
  highlights: 0.9,
  innerGlow: 0.5,
  floorShadow: 0,
  floorCaustic: 0,

  shakeSpeed: 14,
  shakeAmount: 4,
  throwForce: 46,
  roam: 54,
  repel: 340,
  tiltTravel: 34,
  spring: 11,
  drag: 2.1,
};

/** Slider definitions for the bench at /orbs. */
export const ORB_GLASS_SLIDERS: {
  group: string;
  key: keyof OrbGlass;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { group: "Glass", key: "centreZoom", label: "centre zoom", min: 0.3, max: 1.2, step: 0.01 },
  { group: "Glass", key: "edgeBend", label: "edge bend", min: 0, max: 1.5, step: 0.01 },
  { group: "Glass", key: "chromatic", label: "chromatic", min: 0, max: 0.08, step: 0.001 },
  { group: "Glass", key: "rimHaze", label: "rim haze", min: 0, max: 1, step: 0.01 },
  { group: "Glass", key: "rimLine", label: "rim line", min: 0, max: 1.5, step: 0.01 },
  { group: "Glass", key: "highlight", label: "highlight", min: 0, max: 1.5, step: 0.01 },
  { group: "Glass", key: "gloss", label: "gloss", min: 0, max: 1.5, step: 0.01 },
  { group: "Glass", key: "glossSize", label: "gloss size", min: 0.2, max: 2, step: 0.01 },
  { group: "Glass", key: "shellOpacity", label: "painted shell", min: 0, max: 1, step: 0.01 },
  { group: "Glass", key: "parallax", label: "parallax", min: 0, max: 1, step: 0.01 },
  { group: "Glass", key: "float", label: "float", min: 0, max: 3, step: 0.05 },
  { group: "Glass", key: "wobble", label: "wobble", min: 0, max: 3, step: 0.05 },

  { group: "Physical glass", key: "ior", label: "glass density (IOR)", min: 1, max: 2.6, step: 0.01 },
  { group: "Physical glass", key: "wallThickness", label: "wall thickness", min: 0, max: 0.4, step: 0.005 },
  { group: "Physical glass", key: "imageDepth", label: "image depth", min: 0, max: 1, step: 0.01 },
  { group: "Physical glass", key: "glassTint", label: "glass tint", min: 0, max: 1, step: 0.01 },
  { group: "Physical glass", key: "reflections", label: "reflections", min: 0, max: 2, step: 0.01 },

  { group: "Solid glass (painted lens)", key: "rimColourDepth", label: "rim colour depth", min: 0, max: 1.5, step: 0.01 },
  { group: "Solid glass (painted lens)", key: "innerReflections", label: "inner reflections", min: 0, max: 1.5, step: 0.01 },
  { group: "Solid glass (painted lens)", key: "highlights", label: "highlights", min: 0, max: 1.5, step: 0.01 },
  { group: "Solid glass (painted lens)", key: "innerGlow", label: "inner glow", min: 0, max: 1.5, step: 0.01 },
  { group: "Solid glass (painted lens)", key: "floorShadow", label: "floor shadow", min: 0, max: 1, step: 0.01 },
  { group: "Solid glass (painted lens)", key: "floorCaustic", label: "floor caustic", min: 0, max: 1, step: 0.01 },

  { group: "Motion", key: "shakeSpeed", label: "shake speed", min: 0, max: 40, step: 0.5 },
  { group: "Motion", key: "shakeAmount", label: "shake amount", min: 0, max: 10, step: 0.1 },
  { group: "Motion", key: "throwForce", label: "throw force", min: 0, max: 140, step: 1 },
  { group: "Motion", key: "roam", label: "roam", min: 0, max: 160, step: 1 },
  { group: "Motion", key: "repel", label: "repel", min: 0, max: 900, step: 10 },
  { group: "Motion", key: "tiltTravel", label: "tilt travel", min: 0, max: 120, step: 1 },
  { group: "Motion", key: "spring", label: "spring", min: 1, max: 80, step: 0.5 },
  { group: "Motion", key: "drag", label: "drag", min: 0.3, max: 14, step: 0.1 },
];

/** "#bcd7ff" -> [0.74, 0.84, 1] */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(full, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}
