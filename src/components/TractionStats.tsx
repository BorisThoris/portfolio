import { ArrowUpRight } from "lucide-react";
import type { TractionStat } from "../projectTraction";
import "../traction.css";

/** A row of counted figures; each links to the public page it was read from. */
export function TractionStats({ stats, label }: { stats: TractionStat[]; label: string }) {
  return (
    <ul className="traction-stats" aria-label={label}>
      {stats.map((stat) => (
        <li key={stat.label}>
          {stat.url ? (
            <a href={stat.url} target="_blank" rel="noreferrer">
              <strong>{stat.value}</strong>
              <span>{stat.label} <ArrowUpRight size={13} aria-hidden="true" /></span>
            </a>
          ) : (
            <div>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
