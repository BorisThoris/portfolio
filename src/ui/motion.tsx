import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../lib/runtime";

/**
 * Pins every [data-reveal] element in as it scrolls into view (see base.css).
 * Runs once per page; elements already on screen reveal immediately.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)")];
    if (!("IntersectionObserver" in window)) { elements.forEach((el) => el.classList.add("is-in")); return; }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); observer.unobserve(entry.target); }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * A counted figure ("536", "6.8K", "1,193") that counts up once when it first
 * appears. The final text is always the published figure; reduced motion skips
 * the count entirely.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const match = /^([\d,.]+)(\D*)$/.exec(value);
  const target = match ? Number(match[1].replace(/,/g, "")) : NaN;
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced || !Number.isFinite(target) || !ref.current) { setShown(value); return; }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = target * eased;
        const text = decimals ? current.toFixed(decimals) : Math.round(current).toLocaleString("en-US");
        setShown(t < 1 ? `${text}${match![2]}` : value);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      setShown(`0${match![2]}`);
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(ref.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);
  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{shown}</span>
      <span className="visually-hidden">{value}</span>
    </span>
  );
}
