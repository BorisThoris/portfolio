/*
 * The aura: a domain-warped noise field rendered behind the whole site.
 * It draws into a small buffer (the field is soft, so it is upscaled), runs at
 * 30 fps at most, follows the pointer, ripples on click and drifts as the page
 * scrolls. Inside the content column it caps its own brightness so text on the
 * bare background keeps its contrast; the side margins get the full glow.
 */

const vertex = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uEnergy;
uniform vec3 uPulse;
uniform vec3 uBg;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uC4;
uniform float uStrength;
uniform float uDark;
uniform float uLimit;
uniform float uLimitMargin;
uniform float uColumn;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y) * 1.7;
  float t = uTime * 0.045;
  p.y -= uScroll;

  vec2 m = (uMouse - uv) * vec2(asp, 1.0);
  float md = length(m);
  float pull = exp(-md * 2.6);

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p + 3.6 * q + vec2(1.7, 9.2) + 0.7 * t + m * 0.9 * pull),
    fbm(p + 3.6 * q + vec2(8.3, 2.8) - 0.5 * t)
  );
  float f = fbm(p + 3.2 * r);

  // Blue into violet is the body of the field; ember and teal ride the warp as accents.
  vec3 col = mix(uC2, uC3, smoothstep(0.3, 0.7, f));
  col = mix(col, uC1, smoothstep(0.55, 0.85, r.x) * 0.9);
  col = mix(col, uC4, smoothstep(0.62, 0.9, r.y) * 0.8);

  // Aurora curtains: soft vertical folds that bend with the warp.
  float curtain = pow(0.5 + 0.5 * sin(uv.x * 5.0 + r.x * 6.0 + t * 3.0), 3.0) * smoothstep(0.0, 0.9, uv.y + r.y * 0.4);

  float a = smoothstep(0.22, 0.88, f * f * 1.7 + 0.18 * r.x) * (0.75 + 0.35 * curtain);
  a *= uStrength * (1.0 + 0.45 * uEnergy);

  // A bloom that follows the pointer.
  float glow = exp(-md * md * 9.0);
  col = mix(col, uC1, glow * 0.6);
  a += glow * uStrength * 0.55;

  // Click ripple: a ring that expands and fades.
  float pd = length((uv - uPulse.xy) * vec2(asp, 1.0));
  float ring = exp(-pow((pd - uPulse.z * 0.75) * 16.0, 2.0)) * exp(-uPulse.z * 2.4) * step(0.0, uPulse.z);
  col = mix(col, uC4, ring * 0.7);
  a += ring * 0.45;

  // Edge vignette pulls the glow toward the corners in the dark theme.
  vec2 vc = uv - 0.5;
  a += uDark * 0.12 * smoothstep(0.35, 0.75, length(vc * vec2(asp * 0.8, 1.0))) * (0.6 + 0.4 * f);

  // Keep text on the bare background legible: cap how far the blend may move
  // the background's luma, tightly inside the content column, loosely outside.
  float side = smoothstep(uColumn, uColumn + 0.04, abs(uv.x - 0.5));
  float limit = mix(uLimit, uLimitMargin, side);
  float lb = luma(uBg); float lc = luma(col);
  float room = uDark > 0.5
    ? (lc > lb ? (limit - lb) / max(lc - lb, 0.001) : 1.0)
    : (lc < lb ? (lb - limit) / max(lb - lc, 0.001) : 1.0);
  a = clamp(a, 0.0, clamp(room, 0.0, 0.85));

  // Dither so the upscaled gradients don't band.
  a = clamp(a + (hash(gl_FragCoord.xy + fract(uTime * 7.0)) - 0.5) * 0.015, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`;

type Palette = { bg: number[]; c: number[][]; strength: number; limit: number; limitMargin: number; dark: number };

function hex(value: string, fallback: number[]): number[] {
  const match = /^#?([0-9a-f]{6})/i.exec(value.trim());
  if (!match) return fallback;
  const n = parseInt(match[1], 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name);
  const num = (name: string, fallback: number) => {
    const parsed = parseFloat(v(name));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    bg: hex(v("--bg"), [0.95, 0.95, 0.93]),
    c: [hex(v("--aura-1"), [1, 0.5, 0.3]), hex(v("--aura-2"), [0.5, 0.6, 1]), hex(v("--aura-3"), [1, 0.6, 0.8]), hex(v("--aura-4"), [1, 0.85, 0.4])],
    strength: num("--aura-strength", 0.4),
    limit: num("--aura-limit", 0.8),
    limitMargin: num("--aura-limit-margin", 0.6),
    dark: style.colorScheme.includes("dark") ? 1 : 0,
  };
}

export type AuraHandle = { stop: () => void };

/** Starts the shader on `canvas`. Returns null when WebGL is unavailable. */
export function startAura(canvas: HTMLCanvasElement, options: { still: boolean }): AuraHandle | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return null;
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const U = {
    res: u("uRes"), time: u("uTime"), mouse: u("uMouse"), scroll: u("uScroll"), energy: u("uEnergy"), pulse: u("uPulse"),
    bg: u("uBg"), c1: u("uC1"), c2: u("uC2"), c3: u("uC3"), c4: u("uC4"),
    strength: u("uStrength"), dark: u("uDark"), limit: u("uLimit"), limitMargin: u("uLimitMargin"), column: u("uColumn"),
  };

  let palette = readPalette();
  const applyPalette = () => {
    palette = readPalette();
    gl.uniform3fv(U.bg, palette.bg);
    gl.uniform3fv(U.c1, palette.c[0]);
    gl.uniform3fv(U.c2, palette.c[1]);
    gl.uniform3fv(U.c3, palette.c[2]);
    gl.uniform3fv(U.c4, palette.c[3]);
    gl.uniform1f(U.strength, palette.strength);
    gl.uniform1f(U.dark, palette.dark);
    gl.uniform1f(U.limit, palette.limit);
    gl.uniform1f(U.limitMargin, palette.limitMargin);
  };
  applyPalette();

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // The field is soft: ~480px on the long side is plenty once upscaled.
    const scale = Math.min(1, 480 / Math.max(w, h));
    canvas.width = Math.max(2, Math.round(w * scale));
    canvas.height = Math.max(2, Math.round(h * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    // Half the content column (min(100% - 2*gutter, 1240px)) as a fraction of the width.
    const gutter = Math.min(48, Math.max(18, w * 0.04));
    gl.uniform1f(U.column, Math.min(w - 2 * gutter, 1240) / 2 / w);
  };
  resize();

  const mouse = { x: 0.5, y: 0.62, tx: 0.5, ty: 0.62 };
  const pulse = { x: 0.5, y: 0.5, at: -100 };
  let scrollY = window.scrollY;
  let energy = 0;
  let lastScroll = scrollY;
  let running = true;
  let frame = 0;
  let last = 0;
  const start = performance.now();
  let slowFrames = 0;
  let measured = 0;

  // Only the page-wide "Pause motion" toggle; the hero marks itself paused when scrolled away.
  const paused = () => document.hidden || document.querySelector('.home[data-motion="paused"]') !== null;

  const draw = (now: number) => {
    const time = options.still ? 40 : (now - start) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    const velocity = Math.abs(scrollY - lastScroll) / Math.max(1, window.innerHeight);
    lastScroll = scrollY;
    energy = Math.min(1, energy * 0.92 + velocity * 2.5);
    gl.uniform1f(U.time, time);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform1f(U.scroll, (scrollY / Math.max(1, window.innerHeight)) * 0.35);
    gl.uniform1f(U.energy, options.still ? 0 : energy);
    gl.uniform3f(U.pulse, pulse.x, pulse.y, options.still ? -1 : (now - pulse.at) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now: number) => {
    if (!running) return;
    frame = requestAnimationFrame(loop);
    if (now - last < 33 || paused()) return;
    const begin = performance.now();
    last = now;
    draw(now);
    // If this device can't keep up, settle on a still frame.
    if (measured < 90) {
      measured++;
      if (performance.now() - begin > 14) slowFrames++;
      if (measured === 90 && slowFrames > 45) { options.still = true; running = false; cancelAnimationFrame(frame); draw(now); }
    }
  };

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    mouse.tx = event.clientX / window.innerWidth;
    mouse.ty = 1 - event.clientY / window.innerHeight;
  };
  const onDown = (event: PointerEvent) => {
    pulse.x = event.clientX / window.innerWidth;
    pulse.y = 1 - event.clientY / window.innerHeight;
    pulse.at = performance.now();
    if (event.pointerType !== "mouse") { mouse.tx = pulse.x; mouse.ty = pulse.y; }
  };
  const onScroll = () => { scrollY = window.scrollY; if (options.still) draw(performance.now()); };
  const onResize = () => { resize(); if (options.still) draw(performance.now()); };
  const onTheme = () => { applyPalette(); if (options.still) draw(performance.now()); };

  const themeObserver = new MutationObserver(onTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", onTheme);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  if (options.still) draw(performance.now());
  else frame = requestAnimationFrame(loop);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      scheme.removeEventListener("change", onTheme);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
