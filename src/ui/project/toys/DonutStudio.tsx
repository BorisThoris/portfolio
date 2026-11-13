import { useEffect, useRef, useState } from "react";

// Donut Studio's Board.paintComponent, read from its compiled class and ported to
// canvas: an 80 × 130 ellipse (scaled by the shorter side / 420) is drawn from the
// centre, rotated about its own corner every `step` degrees from 0 to 359, each in
// HSB(angle / 360, 0.55, 0.95) with a 1.25 px stroke on rgb(15, 23, 42). The slider
// runs 3 to 30 and starts at 8, as the Swing JSlider does.
const MIN = 3;
const MAX = 30;
const START = 8;

// java.awt.Color.HSBtoRGB, which is not CSS hsl().
function hsb(h: number, s: number, b: number) {
  const sector = (h - Math.floor(h)) * 6;
  const f = sector - Math.floor(sector);
  const p = b * (1 - s);
  const q = b * (1 - s * f);
  const t = b * (1 - s * (1 - f));
  const [r, g, bl] = [[b, t, p], [q, b, p], [p, b, t], [p, q, b], [t, p, b], [b, p, q]][Math.floor(sector) % 6];
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(bl * 255)})`;
}

export function draw(canvas: HTMLCanvasElement, step: number) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = "rgb(15, 23, 42)";
  context.fillRect(0, 0, width, height);
  const scale = Math.min(width, height) / 420;
  const [w, h] = [80 * scale, 130 * scale];
  context.lineWidth = 1.25;
  for (let angle = 0; angle < 360; angle += step) {
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate((angle * Math.PI) / 180);
    context.strokeStyle = hsb(angle / 360, 0.55, 0.95);
    context.beginPath();
    context.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
}

export function DonutStudio() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(START);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    draw(element, step);
    const observer = new ResizeObserver(() => draw(element, step));
    observer.observe(element);
    return () => observer.disconnect();
  }, [step]);

  const rings = Math.ceil(360 / step);
  return (
    <section className="pp-play toy toy--donut" aria-labelledby="toy-title">
      <h2 id="toy-title" className="label">Try it here · the same drawing loop, in your browser</h2>
      <div className="toy__window">
        <p className="toy__titlebar">Donut Studio — drag the bottom edge to resize, and adjust ring spacing</p>
        <div className="toy__canvas-wrap">
          <canvas ref={canvas} className="toy__canvas" role="img" aria-label={`Donut pattern: ${rings} rotated ellipses, ${step} degrees apart`} />
        </div>
        <div className="toy__swing">
          <label htmlFor="donut-step">Ring spacing</label>
          <input id="donut-step" type="range" min={MIN} max={MAX} value={step} onChange={(event) => setStep(Number(event.target.value))} aria-valuetext={`${step} degrees, ${rings} rings`} />
          <output htmlFor="donut-step" className="num">{step}° · {rings} rings</output>
          <button type="button" onClick={() => setStep(START)}>Reset pattern</button>
        </div>
      </div>
      <p className="toy__note">
        The app is Java Swing and does not run in a browser. This is its <code>paintComponent</code> loop, read from the compiled class and ported to a canvas: the same ellipse, the same angles and the same colours. The real window is in the download above.
      </p>
    </section>
  );
}
