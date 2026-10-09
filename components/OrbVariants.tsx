"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { ORB_FRAG, ORB_VERT, SHELL_FRAG, SHELL_VERT } from "@/lib/orbShader";
import { ORB_GLASS_DEFAULTS, hexToRgb, type OrbGlass } from "@/lib/orbGlass";
import type { Orb } from "@/lib/orbs";
import type { MotionRef } from "@/hooks/useDeviceMotion";

/**
 * Every treatment we've put the orbs through, as standalone tiles, so they
 * can be looked at together instead of one at a time across a conversation.
 *
 * They all take the same orb and the same live tilt, so the only thing that
 * differs between tiles is the treatment itself.
 */
type VariantProps = { orb: Orb; size: number; motion: MotionRef };

/* ------------------------------------------------------------------ 1 */
/** The sprite, clipped to its circle. Where we started. */
export function FlatOrb({ orb, size }: VariantProps) {
  return (
    <div className="overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <Image src={orb.src} alt="" width={orb.natural} height={orb.natural} className="h-full w-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ 2 */
/**
 * CSS layers: the painted shell holds still while a masked copy of the art
 * slides inside it, with a soft specular over the top.
 */
export function LayeredOrb({ orb, size, motion }: VariantProps) {
  const core = useRef<HTMLDivElement>(null);
  const spec = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const { tiltX, tiltY } = motion.current;
      if (core.current) {
        core.current.style.transform = `translate(${tiltX * 5}px, ${tiltY * 5}px) scale(1.07)`;
      }
      if (spec.current) {
        const r = size / 2;
        spec.current.style.transform = `translate(${(-0.42 - tiltX) * r * 0.26}px, ${(-0.58 - tiltY) * r * 0.26}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [motion, size]);

  const mask = "radial-gradient(circle, #000 52%, transparent 74%)";
  return (
    <div className="relative isolate overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <Image src={orb.src} alt="" width={orb.natural} height={orb.natural} className="absolute inset-0 h-full w-full" />
      <div ref={core} className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <Image src={orb.src} alt="" width={orb.natural} height={orb.natural} className="h-full w-full" />
      </div>
      <div
        ref={spec}
        className="absolute rounded-full"
        style={{
          left: size * 0.28,
          top: size * 0.28,
          width: size * 0.44,
          height: size * 0.44,
          background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.2) 48%, transparent 72%)",
          filter: `blur(${size * 0.03}px)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `inset 0 0 ${size * 0.07}px rgba(60,40,110,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.35)` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ 3 */
/** Thin reflections: a hard streak across the face and two rim arcs. */
export function ThinOrb({ orb, size, motion }: VariantProps) {
  const streak = useRef<HTMLDivElement>(null);
  const rim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const { tiltX, tiltY } = motion.current;
      const lx = -0.42 - tiltX;
      const ly = -0.58 - tiltY;
      const r = size / 2;
      const deg = (Math.atan2(ly, lx) * 180) / Math.PI + 90;
      const reach = Math.min(1, Math.hypot(lx, ly));
      if (streak.current) {
        streak.current.style.transform = `translate(${lx * r * 0.3}px, ${ly * r * 0.3}px) rotate(${deg}deg) scaleY(${1 - 0.4 * reach})`;
      }
      if (rim.current) rim.current.style.transform = `rotate(${deg}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [motion, size]);

  const ring = "radial-gradient(circle, transparent 84%, #000 91%, #000 97%, transparent 100%)";
  return (
    <div className="relative isolate overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <Image src={orb.src} alt="" width={orb.natural} height={orb.natural} className="absolute inset-0 h-full w-full" />
      <div
        ref={streak}
        className="absolute rounded-full"
        style={{
          left: size * 0.19,
          top: size * 0.47,
          width: size * 0.62,
          height: size * 0.055,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, transparent)",
          filter: `blur(${size * 0.018}px)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        ref={rim}
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.95) 0deg, rgba(255,255,255,0) 30deg, rgba(255,255,255,0) 140deg, rgba(255,255,255,0.4) 182deg, rgba(255,255,255,0) 232deg, rgba(255,255,255,0) 330deg, rgba(255,255,255,0.95) 360deg)",
          maskImage: ring,
          WebkitMaskImage: ring,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ 4 */
/**
 * Liquid glass, after KokonutUI.
 *
 * Their card puts the turbulence filter in `backdrop-filter`, which only
 * Firefox honours for `url()` filters — in Chrome and Safari you'd get the
 * shadow stack and no distortion at all. Applied to the art directly it
 * works everywhere, and on an orb that IS the thing you want warped.
 */
const GLASS_SHADOW =
  "0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 3px 3px 0.5px -3px rgba(0,0,0,0.9), inset -3px -3px 0.5px -3px rgba(0,0,0,0.85), inset 1px 1px 1px -0.5px rgba(0,0,0,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.6), inset 0 0 6px 6px rgba(0,0,0,0.12), inset 0 0 2px 2px rgba(0,0,0,0.06), 0 0 12px rgba(255,255,255,0.15)";

export function LiquidOrb({ orb, size }: VariantProps) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" seed="4" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="14" xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="0.4" />
          </filter>
        </defs>
      </svg>
      <Image
        src={orb.src}
        alt=""
        width={orb.natural}
        height={orb.natural}
        className="h-full w-full"
        style={{ filter: `url(#${id})` }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: GLASS_SHADOW }} />
    </div>
  );
}

/* ------------------------------------------------------------------ 5/6 */
/**
 * The shader. `shell` decides whether the designed line work is drawn back
 * over the refracted body, which is the only difference between the last
 * two things we looked at.
 */
export function GlOrb({
  orb,
  size,
  motion,
  shell,
  glass = ORB_GLASS_DEFAULTS,
}: VariantProps & { shell: boolean; glass?: OrbGlass }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ shell, glass });
  useEffect(() => {
    live.current = { shell, glass };
  }, [shell, glass]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    const build = (vs: string, fs: string) => {
      const p = gl.createProgram()!;
      for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "");
        gl.attachShader(p, sh);
      }
      gl.linkProgram(p);
      return p;
    };

    const prog = build(ORB_VERT, ORB_FRAG);
    const shellProg = build(SHELL_VERT, SHELL_FRAG);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const textures = new Map<string, WebGLTexture>();
    let disposed = false;
    for (const src of [orb.src, orb.shell]) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      textures.set(src, tex);
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        if (disposed) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    }

    const u = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    let raf = 0;
    const tick = () => {
      const { tiltX, tiltY } = motion.current;
      const g = live.current.glass;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      const aPos = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(u(prog, "u_resolution"), size, size);
      gl.uniform2f(u(prog, "u_center"), size / 2, size / 2);
      gl.uniform1f(u(prog, "u_size"), size);
      gl.uniform1f(u(prog, "u_px"), 1 / (size * dpr));
      gl.uniform1f(u(prog, "u_alpha"), 1);
      gl.uniform2f(u(prog, "u_light"), -0.42 - tiltX * 0.85, -0.58 - tiltY * 0.85);
      gl.uniform1i(u(prog, "u_tex"), 0);
      gl.uniform1f(u(prog, "u_centreZoom"), g.centreZoom);
      gl.uniform1f(u(prog, "u_edgeBend"), g.edgeBend);
      gl.uniform1f(u(prog, "u_chromatic"), g.chromatic);
      gl.uniform1f(u(prog, "u_rimHaze"), g.rimHaze);
      gl.uniform1f(u(prog, "u_rimLine"), g.rimLine);
      gl.uniform1f(u(prog, "u_highlight"), g.highlight);
      gl.uniform1f(u(prog, "u_gloss"), g.gloss);
      gl.uniform1f(u(prog, "u_glossDual"), g.glossShape === "dual" ? 1 : 0);
      gl.uniform1f(u(prog, "u_glossSize"), g.glossSize);
      gl.uniform3fv(u(prog, "u_tint"), hexToRgb(g.tint));
      gl.uniform1f(u(prog, "u_parallax"), g.parallax);
      gl.uniform1f(u(prog, "u_physicalOn"), g.physicalOn ? 1 : 0);
      gl.uniform1f(u(prog, "u_ior"), g.ior);
      gl.uniform1f(u(prog, "u_wallThickness"), g.wallThickness);
      gl.uniform1f(u(prog, "u_imageDepth"), g.imageDepth);
      gl.uniform1f(u(prog, "u_glassTint"), g.glassTint);
      gl.uniform1f(u(prog, "u_reflections"), g.reflections);
      gl.uniform1f(u(prog, "u_solidOn"), g.solidOn ? 1 : 0);
      gl.uniform1f(u(prog, "u_rimColourDepth"), g.rimColourDepth);
      gl.uniform1f(u(prog, "u_innerReflections"), g.innerReflections);
      gl.uniform1f(u(prog, "u_highlights"), g.highlights);
      gl.uniform1f(u(prog, "u_innerGlow"), g.innerGlow);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.get(orb.src)!);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (live.current.shell) {
        const box = orb.shellBox;
        gl.useProgram(shellProg);
        const sp = gl.getAttribLocation(shellProg, "a_pos");
        gl.enableVertexAttribArray(sp);
        gl.vertexAttribPointer(sp, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(u(shellProg, "u_resolution"), size, size);
        gl.uniform1i(u(shellProg, "u_tex"), 0);
        gl.uniform4f(u(shellProg, "u_rect"), box.left * size, box.top * size, box.width * size, box.height * size);
        gl.uniform1f(u(shellProg, "u_alpha"), g.shellOpacity);
        gl.bindTexture(gl.TEXTURE_2D, textures.get(orb.shell)!);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(quad);
      gl.deleteProgram(prog);
      gl.deleteProgram(shellProg);
    };
  }, [orb, size, motion]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} aria-hidden />;
}
