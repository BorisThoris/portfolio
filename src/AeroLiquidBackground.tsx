import React from 'react';
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl';

type AeroLiquidBackgroundProps = {
  accent: string;
};

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uAccent;
uniform float uMotion;
uniform vec2 uTilt;
varying vec2 vUv;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate2d(0.62) * p * 2.03 + 0.11;
    amplitude *= 0.52;
  }
  return value;
}

float blob(vec2 p, vec2 center, vec2 radius, float angle) {
  vec2 q = rotate2d(angle) * (p - center);
  float d = length(q / radius);
  return smoothstep(1.0, 0.12, d);
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float t = uTime * uMotion;
  vec2 tilt = uTilt * vec2(0.28, 0.18);

  vec2 flow = p;
  flow += tilt;
  flow.x += sin(p.y * 3.2 + t * 0.18) * 0.08;
  flow.y += sin(p.x * 2.4 - t * 0.14) * 0.07;
  float marble = fbm(flow * 2.2 + vec2(t * 0.035, -t * 0.025));
  float fine = fbm(flow * 6.4 + vec2(-t * 0.06, t * 0.045));
  flow += vec2(marble - 0.5, fine - 0.5) * 0.34;

  float field = 0.0;
  field += blob(flow, vec2(-0.72 + sin(t * 0.09) * 0.08, 0.26), vec2(0.54, 0.34), -0.52);
  field += blob(flow, vec2(-0.12 + sin(t * 0.07) * 0.05, -0.28), vec2(0.74, 0.24), 0.18);
  field += blob(flow, vec2(0.58 + cos(t * 0.08) * 0.07, 0.20), vec2(0.52, 0.42), 0.66);
  field += blob(flow, vec2(0.12, 0.58 + sin(t * 0.06) * 0.05), vec2(0.38, 0.30), -0.18);
  field += blob(flow, vec2(-0.42, -0.62), vec2(0.38, 0.22), 0.82);
  field = clamp(field, 0.0, 1.0);

  float ribbon = sin((flow.x * 3.6 + flow.y * 5.2) + marble * 5.0 + t * 0.18) * 0.5 + 0.5;
  float crispRibbon = sin((flow.x * 9.5 - flow.y * 7.8) + fine * 8.0 + t * 0.34) * 0.5 + 0.5;
  float vein = pow(smoothstep(0.54, 0.98, crispRibbon), 5.0) * 0.34;
  float edge = smoothstep(0.25, 0.82, field) - smoothstep(0.84, 1.0, field);
  float slick = pow(smoothstep(0.2, 1.0, fine) * (0.35 + field), 1.7);
  float highlight = pow(max(0.0, sin((flow.x - flow.y) * 12.0 + marble * 10.5 + t * 0.28)), 11.0);
  float bubbleA = smoothstep(0.055, 0.0, length(flow - vec2(-0.88, 0.34 + sin(t * 0.18) * 0.03)));
  float bubbleB = smoothstep(0.075, 0.0, length(flow - vec2(0.72, -0.18 + cos(t * 0.12) * 0.04)));
  float bubbleC = smoothstep(0.038, 0.0, length(flow - vec2(0.16, 0.68)));

  vec3 deep = vec3(0.012, 0.025, 0.030);
  vec3 cyan = mix(vec3(0.12, 0.84, 1.00), uAccent, 0.34);
  vec3 violet = mix(vec3(0.60, 0.18, 0.92), uAccent, 0.20);
  vec3 coral = mix(vec3(1.00, 0.32, 0.54), uAccent, 0.22);
  vec3 peach = vec3(1.00, 0.72, 0.45);
  vec3 pearl = vec3(0.82, 0.98, 1.00);

  vec3 color = deep;
  color = mix(color, cyan, smoothstep(0.05, 0.8, field));
  color = mix(color, violet, smoothstep(0.12, 0.92, ribbon) * (0.36 + field * 0.36));
  color = mix(color, coral, smoothstep(0.38, 1.0, marble) * 0.42);
  color = mix(color, peach, pow(1.0 - ribbon, 3.0) * 0.28);
  color = mix(color, pearl, highlight * 0.58 + slick * 0.1 + vein * 0.42 + edge * 0.08);
  color += uAccent * (0.10 + field * 0.18);
  color += vec3(0.02, 0.05, 0.06) * crispRibbon;
  color += (bubbleA + bubbleB + bubbleC) * vec3(0.75, 0.95, 1.0) * 0.36;

  float vignette = smoothstep(1.35, 0.24, length(p));
  color *= 0.50 + vignette * 0.84;
  color = pow(color, vec3(0.88));

  gl_FragColor = vec4(color, 1.0);
}
`;

export function AeroLiquidBackground({ accent }: AeroLiquidBackgroundProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const accentUniformRef = React.useRef<{ value: Color } | null>(null);
  const accentCurrentRef = React.useRef(new Color(accent));
  const accentTargetRef = React.useRef(new Color(accent));
  const tiltTargetRef = React.useRef<[number, number]>([0, 0]);
  const tiltCurrentRef = React.useRef<[number, number]>([0, 0]);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const renderer = new Renderer({
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 3)
    });
    const gl = renderer.gl;
    gl.canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uAccent: { value: accentCurrentRef.current },
        uMotion: { value: reducedMotion.matches ? 0 : 1 },
        uTilt: { value: [0, 0] }
      }
    });
    accentUniformRef.current = program.uniforms.uAccent;
    const mesh = new Mesh(gl, { geometry, program });

    let frame = 0;
    let start = performance.now();

    const resize = () => {
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };

    const render = (time: number) => {
      const tilt = tiltCurrentRef.current;
      const tiltTarget = tiltTargetRef.current;
      const accentCurrent = accentCurrentRef.current;
      const accentTarget = accentTargetRef.current;
      tilt[0] += (tiltTarget[0] - tilt[0]) * 0.045;
      tilt[1] += (tiltTarget[1] - tilt[1]) * 0.045;
      accentCurrent.r += (accentTarget.r - accentCurrent.r) * 0.045;
      accentCurrent.g += (accentTarget.g - accentCurrent.g) * 0.045;
      accentCurrent.b += (accentTarget.b - accentCurrent.b) * 0.045;
      program.uniforms.uTime.value = (time - start) * 0.001;
      program.uniforms.uAccent.value = accentCurrent;
      program.uniforms.uTilt.value = tilt;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(render);
    };

    const handleMotionPreference = () => {
      program.uniforms.uMotion.value = reducedMotion.matches ? 0 : 1;
      if (reducedMotion.matches) {
        start = performance.now();
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (typeof event.gamma !== 'number' || typeof event.beta !== 'number') return;
      tiltTargetRef.current = [
        Math.max(-1, Math.min(1, event.gamma / 35)),
        Math.max(-1, Math.min(1, (event.beta - 45) / 45))
      ];
    };

    resize();
    render(start);
    window.addEventListener('resize', resize);
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      if (gl.canvas.parentNode === host) {
        host.removeChild(gl.canvas);
      }
      accentUniformRef.current = null;
      geometry.remove();
    };
  }, []);

  React.useEffect(() => {
    accentTargetRef.current = new Color(accent);
  }, [accent]);

  return (
    <div
      ref={hostRef}
      className="aero-background"
      style={{ '--aero-accent': accent } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}
