import { useState } from "react";
import { INTEGER_TYPES, integerFit } from "./integerFit";

// The inputs the demo itself runs, so each one is a boundary worth crossing.
const PICKS = ["-129", "127", "128", "255", "65536", "2147483648", "9223372036854775808", "18446744073709551616"];

export function IntegerFitToy() {
  const [text, setText] = useState("127");
  const fit = integerFit(text);
  const fits = fit.kind === "fits" ? fit.types : [];
  const nudge = (by: bigint) => { if (fit.kind !== "invalid") setText(String(fit.value + by)); };

  return (
    <section className="pp-play toy toy--int" aria-labelledby="toy-title">
      <h2 id="toy-title" className="label">Try it here · the same rule, with your number</h2>
      <div className="toy__console">
        <p className="toy__prompt" aria-hidden="true">$ dotnet run --project IntegerFit --</p>
        <div className="int__input">
          <button type="button" onClick={() => nudge(-1n)} disabled={fit.kind === "invalid"} aria-label="Subtract one">−1</button>
          <input value={text} onChange={(event) => setText(event.target.value)} inputMode="numeric" spellCheck={false} aria-label="A whole number, any size" aria-describedby="int-result" />
          <button type="button" onClick={() => nudge(1n)} disabled={fit.kind === "invalid"} aria-label="Add one">+1</button>
        </div>
        <ul className="int__types" aria-label="C# integer types">
          {INTEGER_TYPES.map((type) => (
            <li key={type.name} className={fits.includes(type.name) ? "is-fit" : undefined}>
              <span className="int__name">{type.name}</span>
              <span className="int__range num">{type.min.toLocaleString("en")} … {type.max.toLocaleString("en")}</span>
            </li>
          ))}
        </ul>
        <p className="int__result" id="int-result" aria-live="polite">
          {fit.kind === "fits" ? `Fits: ${fit.types.join(", ")}`
            : fit.kind === "none" ? "Does not fit a built-in integer type. Use BigInteger."
            : "Not a whole number. The original reads it with BigInteger.Parse, which throws a FormatException."}
        </p>
        <div className="int__picks" role="group" aria-label="Numbers from the demo">
          {PICKS.map((pick) => <button key={pick} type="button" className="num" onClick={() => setText(pick)}>{pick}</button>)}
        </div>
      </div>
      <p className="toy__note">
        Integer Fit is a C# console program. Its rule is small enough to run here exactly: the number is held as a BigInt, as the C# reads it into a <code>BigInteger</code>, and checked against each type’s range in C#’s order. Press +1 on 127 or 255 to watch a type drop out.
      </p>
    </section>
  );
}
