/**
 * The glass.
 *
 * Each orb is a quad carrying a sphere: the fragment shader rebuilds a
 * hemisphere normal from the quad's UV and then does what CSS fundamentally
 * cannot — bends the light passing through it. That bend is the whole
 * reason this is a shader: it is what stops an orb reading as a printed
 * disc and starts it reading as a ball with something inside.
 *
 * The painted art supplies only the CONTENTS. We sample inside it (see
 * `u_centreZoom`) so the shell Figma painted never reaches the screen, and
 * every rim, highlight and reflection below is computed from the normal.
 *
 * Three models stack, each able to be switched off:
 *   physical — the shell as a refracting solid with a wall and a tint
 *   solid    — the painted-lens read: colour carried in the glass, light
 *              bouncing around inside it
 * and over both, the surface treatment: gloss, highlight, rim, haze.
 */
export const ORB_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_resolution;   // canvas size in design px
uniform vec2 u_center;       // orb centre in design px
uniform float u_size;        // orb diameter in design px
out vec2 v_uv;

void main() {
  v_uv = a_pos;
  vec2 px = u_center + (a_pos - 0.5) * u_size;
  vec2 clip = (px / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

export const ORB_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec2  u_light;          // where the light is, -1..1, from the gyro
uniform float u_px;             // one device px in UV units, for the edge
uniform float u_alpha;          // fades orbs out when the cluster regroups

// --- Glass
uniform float u_centreZoom;
uniform float u_edgeBend;
uniform float u_chromatic;
uniform float u_rimHaze;
uniform float u_rimLine;
uniform float u_highlight;
uniform float u_gloss;
uniform float u_glossDual;      // 0 = single window, 1 = dual
uniform float u_glossSize;
uniform vec3  u_tint;
uniform float u_parallax;

// --- Physical glass
uniform float u_physicalOn;
uniform float u_ior;
uniform float u_wallThickness;
uniform float u_imageDepth;
uniform float u_glassTint;
uniform float u_reflections;

// --- Solid glass (painted lens)
uniform float u_solidOn;
uniform float u_rimColourDepth;
uniform float u_innerReflections;
uniform float u_highlights;
uniform float u_innerGlow;

/* A room, procedurally: a bright ceiling falling to a darker floor with a
   window in it. The window is what you see sliding across the glass as a
   thin hard streak, and it is the single most convincing thing about a
   shiny sphere. "dual" adds its weaker partner opposite, which is what a
   real room does — two sources, never one. */
vec3 room(vec3 d) {
  float v = d.y * 0.5 + 0.5;
  vec3 sky = mix(vec3(0.40, 0.44, 0.54), vec3(0.86, 0.89, 0.95), smoothstep(0.08, 0.95, v));

  float s = max(u_glossSize, 0.05);
  float wy = smoothstep(0.26 - 0.18 * s, 0.26, d.y) * (1.0 - smoothstep(0.26 + 0.30 * s, 0.26 + 0.52 * s, d.y));
  float wx = smoothstep(-0.30 - 0.52 * s, -0.30 - 0.14 * s, d.x) * (1.0 - smoothstep(0.02, 0.02 + 0.40 * s, d.x));
  float win = wy * wx;

  float by = smoothstep(-0.55, -0.22, d.y) * (1.0 - smoothstep(0.02, 0.26, d.y));
  float bx = smoothstep(0.08, 0.34, d.x) * (1.0 - smoothstep(0.62, 0.92, d.x));
  float back = by * bx * u_glossDual * 0.55;

  return sky + vec3(win + back);
}

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;

  float r = sqrt(r2);
  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vec3(p, z);                 // hemisphere normal
  vec3 V = vec3(0.0, 0.0, 1.0);        // orthographic view
  vec3 L = normalize(vec3(u_light, 0.85));

  // --- how the ray bends on the way in ------------------------------
  // Weakest head-on, strongest at the rim, which is exactly how a lens
  // behaves and why the contents crush against the edge.
  float eta = mix(1.0, 1.0 / max(u_ior, 1.0001), u_physicalOn);
  vec3 R = refract(-V, n, eta);
  float bend = u_edgeBend * (0.35 + 0.65 * r2);
  // imageDepth hangs the art further behind the surface, so the same
  // bend sweeps it further.
  vec2 off = R.xy * bend * (1.0 + u_imageDepth * 2.0);

  vec2 base = p * u_centreZoom + off + u_light * u_parallax * 0.12;

  // --- chromatic aberration -----------------------------------------
  // Glass does not bend every wavelength equally. Tiny values only; this
  // is the difference between "rendered" and "photographed".
  vec2 disp = normalize(off + vec2(1e-6)) * u_chromatic;
  vec3 art;
  art.r = texture(u_tex, clamp(0.5 + (base + disp) * 0.5, 0.002, 0.998)).r;
  art.g = texture(u_tex, clamp(0.5 + base * 0.5, 0.002, 0.998)).g;
  art.b = texture(u_tex, clamp(0.5 + (base - disp) * 0.5, 0.002, 0.998)).b;
  float alpha = texture(u_tex, clamp(0.5 + base * 0.5, 0.002, 0.998)).a;

  vec3 col = art;

  // --- the glass itself has a colour --------------------------------
  // Longer path near the rim means more of it, like real stained glass.
  float path = mix(1.0, 1.0 + r2 * 1.6, u_physicalOn);
  col = mix(col, col * u_tint, clamp(u_glassTint * path * 0.5, 0.0, 1.0));

  // --- the wall ------------------------------------------------------
  // Everything outside this radius is shell rather than contents.
  float wall = smoothstep(1.0 - max(u_wallThickness, 0.001) * 2.0, 1.0, r);

  // --- painted lens: colour carried in the glass ---------------------
  if (u_solidOn > 0.5) {
    // The rim takes on the contents' own colour, which is what makes a
    // solid glass bead read as one material rather than a shell over a
    // picture.
    vec3 centre = texture(u_tex, vec2(0.5)).rgb;
    col = mix(col, centre, wall * u_rimColourDepth * 0.55);

    // Light that got in, hit the far wall and came back.
    float innerFace = max(dot(n, -L), 0.0);
    col += art * pow(innerFace, 2.0) * u_innerReflections * 0.35;

    // A soft glow from the body, strongest where it is thickest.
    col += art * (1.0 - r2) * u_innerGlow * 0.22;
  }

  // --- the room, reflected off the front surface ---------------------
  // Tilting the phone turns the room, never the orb.
  vec3 Rr = normalize(reflect(-V, n) + vec3(u_light * 0.55, 0.0));
  float fres = pow(1.0 - max(dot(n, V), 0.0), 4.5);
  vec3 env = room(Rr);
  col = mix(col, env, clamp(fres * u_gloss * u_reflections * 1.6, 0.0, 0.8));

  // --- frosted shell --------------------------------------------------
  col = mix(col, mix(col, vec3(0.97, 0.98, 1.0), 0.75), wall * u_rimHaze);

  // --- highlights ------------------------------------------------------
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(n, H), 0.0), 78.0);
  col += spec * u_highlight * 0.85;

  if (u_solidOn > 0.5) {
    // A second, broader highlight — the painted read always has two.
    float wide = pow(max(dot(n, H), 0.0), 11.0);
    col += wide * u_highlights * 0.14;
  }

  // --- the rim line ----------------------------------------------------
  float line = smoothstep(0.90, 0.995, r) * (1.0 - smoothstep(0.995, 1.0, r));
  float graze = max(dot(normalize(vec3(p, 0.0)), normalize(vec3(u_light, 0.0))), 0.0);
  col += line * (0.35 + 0.65 * pow(graze, 2.0)) * u_rimLine;
  // and the far side darkens, which is what gives the sphere mass
  col *= 1.0 - smoothstep(0.72, 1.0, r2) * 0.16 * (1.0 - graze);

  // Reflections are grey, and mixing toward grey drains the art.
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 1.12);

  float edge = 1.0 - smoothstep(1.0 - u_px * 2.0, 1.0, r);
  outColor = vec4(col, alpha * edge * u_alpha);
}`;

/**
 * The painted shell, drawn over the refracted body.
 *
 * Plain textured quad — the artwork already carries its own gradients and
 * line weights, and the one thing we add is the ability to fade it. The
 * shell deliberately does NOT move with the tilt: a glass bead's surface
 * stays where it is while what's behind it swims.
 */
export const SHELL_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_resolution;
uniform vec4 u_rect;        // x, y, w, h in design px
out vec2 v_uv;

void main() {
  v_uv = a_pos;
  vec2 px = u_rect.xy + a_pos * u_rect.zw;
  vec2 clip = (px / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

export const SHELL_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_tex;
uniform float u_alpha;

void main() {
  vec4 c = texture(u_tex, v_uv);
  outColor = vec4(c.rgb, c.a * u_alpha);
}`;
