import { useMemo, useState } from "react";
import { RandomGen } from "./weightedDraw";

// The engine's README example: five outcomes and their odds, editable. Probabilities
// go to RandomGen exactly as typed (percent / 100), so a bad set fails with the
// engine's own error message instead of being quietly normalised.
const OUTCOMES = [-1, 0, 1, 2, 3];
const PRESETS: Record<string, number[]> = {
  "README example": [1, 30, 58, 10, 1],
  "Fair die (0–3)": [0, 25, 25, 25, 25],
  "Long shot": [0, 0, 98, 0, 2],
};
const DRAWS = 10_000;

export function WeightedDrawLab() {
  const [percent, setPercent] = useState<number[]>(PRESETS["README example"]);
  const [counts, setCounts] = useState<number[] | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const [rolls, setRolls] = useState(0);
  const [drawError, setDrawError] = useState("");

  const engine = useMemo(() => {
    try {
      return { gen: new RandomGen(OUTCOMES, percent.map((value) => value / 100)), error: "" };
    } catch (error) {
      return { gen: null, error: (error as Error).message };
    }
  }, [percent]);

  const change = (index: number, value: string) => {
    const next = [...percent];
    next[index] = value === "" ? 0 : Number(value);
    setPercent(next);
    setCounts(null);
    setLast(null);
  };
  const preset = (name: string) => { setPercent(PRESETS[name]); setCounts(null); setLast(null); };
  // The engine can fail mid-draw (IndexError); show it rather than hide it.
  const attempt = (run: (gen: RandomGen) => void) => {
    if (!engine.gen) return;
    try { run(engine.gen); setDrawError(""); } catch (error) { setDrawError((error as Error).message); }
  };
  const drawOnce = () => attempt((gen) => { setLast(gen.nextNum()); setRolls((value) => value + 1); });
  const drawMany = () => attempt((gen) => {
    const tally = OUTCOMES.map(() => 0);
    for (let i = 0; i < DRAWS; i++) tally[OUTCOMES.indexOf(gen.nextNum())]++;
    setCounts(tally);
  });

  const total = percent.reduce((sum, value) => sum + value, 0);
  const top = Math.max(...percent, ...(counts ?? []).map((count) => (count / DRAWS) * 100), 1);

  return (
    <section className="pp-play toy toy--draw" aria-labelledby="toy-title">
      <h2 id="toy-title" className="label">Try it here · the engine, ported and checked against the Python</h2>
      <div className="toy__panel">
        <div className="draw__presets" role="group" aria-label="Preset odds">
          {Object.keys(PRESETS).map((name) => (
            <button key={name} type="button" className="draw__preset" onClick={() => preset(name)} aria-pressed={PRESETS[name].every((value, index) => value === percent[index])}>{name}</button>
          ))}
        </div>
        <table className="draw__table">
          <caption className="visually-hidden">Odds for each outcome, and what {DRAWS.toLocaleString("en")} draws produced</caption>
          <thead>
            <tr><th scope="col">Outcome</th><th scope="col">Expected</th><th scope="col">Observed</th><th scope="col" className="draw__bar-col">Distribution</th></tr>
          </thead>
          <tbody>
            {OUTCOMES.map((outcome, index) => {
              const observed = counts ? (counts[index] / DRAWS) * 100 : null;
              return (
                <tr key={outcome} className={last === outcome ? "is-last" : undefined}>
                  <th scope="row" className="num">{outcome}</th>
                  <td>
                    <label className="draw__weight">
                      <input type="number" min={0} max={100} step={0.5} value={percent[index]} onChange={(event) => change(index, event.target.value)} aria-label={`Chance of ${outcome}, percent`} />
                      <span aria-hidden="true">%</span>
                    </label>
                  </td>
                  <td className="num">{observed === null ? "—" : `${observed.toFixed(2)}%`}<span className="draw__count">{counts ? ` ${counts[index].toLocaleString("en")}` : ""}</span></td>
                  <td className="draw__bar-col" aria-hidden="true">
                    <span className="draw__bar draw__bar--expected" style={{ width: `${(percent[index] / top) * 100}%` }} />
                    {observed !== null ? <span className="draw__bar draw__bar--observed" style={{ width: `${(observed / top) * 100}%` }} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="draw__actions">
          <button type="button" className="btn btn--primary" onClick={drawMany} disabled={!engine.gen}>Draw {DRAWS.toLocaleString("en")}</button>
          <button type="button" className="btn" onClick={drawOnce} disabled={!engine.gen}>Draw one</button>
          <p className="draw__last" aria-live="polite">
            {last !== null ? <><span className="draw__ball num" key={rolls}>{last}</span> came up</> : <span className="draw__sum num">Total {Number(total.toFixed(4))}%</span>}
          </p>
        </div>
        {engine.error || drawError ? <p className="draw__error" role="alert"><code>{engine.error || drawError}</code></p> : null}
      </div>
      <p className="toy__note">
        The engine is Python; this is its <code>RandomGen</code> class ported to TypeScript and run beside the original on 3,000 sets of odds with identical results: the same checks and messages, Python’s rounding to two places, and the same binary search over cumulative odds. Python draws with <code>random.random()</code> and this with <code>Math.random()</code>, so the counts differ run to run, as they should.
      </p>
    </section>
  );
}
