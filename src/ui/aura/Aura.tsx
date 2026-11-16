import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { AuraHandle } from "./auraGl";
import "./aura.css";

/**
 * The layered background behind every page: soft CSS glows (instant, and the
 * fallback without WebGL), then the shader, then a film grain. It sits at
 * z-index -1, above the grid paper on <body> and below all content. The shader
 * loads after the page is idle so it never delays the first paint.
 */
export function Aura() {
  const { pathname } = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const print = pathname.startsWith("/cv-print");

  useEffect(() => {
    if (print || window.matchMedia("(forced-colors: active)").matches) return;
    let handle: AuraHandle | null = null;
    let cancelled = false;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    const boot = () => {
      import("./auraGl").then(({ startAura }) => {
        if (cancelled || !canvasRef.current) return;
        // If the GPU drops the context, fall back to the static glows.
        handle = startAura(canvasRef.current, { still, onLost: () => setLive(false) });
        if (handle) setLive(true);
      }).catch(() => {});
    };
    const idle = (fn: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 2500 }) : window.setTimeout(fn, 1200);
    const later = () => idle(boot);
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", later);
      handle?.stop();
    };
  }, [print]);

  if (print) return null;
  return (
    <div className={live ? "aura aura--live" : "aura"} aria-hidden="true">
      <div className="aura__glow" />
      <canvas ref={canvasRef} className="aura__gl" />
      <div className="aura__grain" />
    </div>
  );
}
