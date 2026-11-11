import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import "./parts.css";
import type { TractionStat } from "../projectTraction";
import { CountUp } from "./motion";

const colors = ["yellow", "pink", "blue", "green"] as const;
const tilts = ["-2deg", "1.5deg", "-1deg", "2deg"];

/** Counted figures as post-it notes; each links to the public page it was read from. */
export function Stats({ stats, label }: { stats: TractionStat[]; label: string }) {
  return (
    <ul className="stats" aria-label={label}>
      {stats.map((stat, index) => {
        const style = { "--tilt": tilts[index % tilts.length], "--i": index } as CSSProperties;
        const className = `note note--${colors[index % colors.length]}`;
        const body = (
          <>
            <CountUp className="note__big" value={stat.value} />
            <span className="stats__label">{stat.label}{stat.url ? <ArrowUpRight size={12} aria-hidden="true" /> : null}</span>
          </>
        );
        return (
          <li key={stat.label}>
            {stat.url
              ? <a className={className} href={stat.url} target="_blank" rel="noreferrer" data-reveal style={style}>{body}</a>
              : <div className={className} data-reveal style={style}>{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}
