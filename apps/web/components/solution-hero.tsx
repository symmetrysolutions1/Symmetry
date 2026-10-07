import Link from "next/link";
import { ArrowRight } from "./icons";

type SolutionHeroProps = {
  eyebrow: string;
  title: string;
  copy: string;
  signal: string;
  tone: "nature" | "enterprise" | "eudr";
  showActions?: boolean;
  showSignalGraph?: boolean;
  compactSignal?: boolean;
};

export function SolutionHero({
  eyebrow,
  title,
  copy,
  signal,
  tone,
  showActions = true,
  showSignalGraph = true,
  compactSignal = false,
}: SolutionHeroProps) {
  return (
    <section className={`solution-hero solution-${tone}`}>
      <div className="shell solution-hero-grid">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="solution-lede">{copy}</p>
          {showActions ? (
            <div className="hero-actions">
              <Link className="button button-light" href="/contact">
                Diseñar una implementación <ArrowRight />
              </Link>
              <Link className="button button-ghost-light" href="/proof">
                Ver infraestructura
              </Link>
            </div>
          ) : null}
        </div>
        <div className={`solution-signal${compactSignal ? " solution-signal-compact" : ""}`} aria-label={signal}>
          <span className="signal-label">Señal operativa</span>
          <strong>{signal}</strong>
          {showSignalGraph ? (
            <>
              <div className="signal-graph" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="signal-meta">
                <span>Fuente declarada</span>
                <span>Integridad verificable</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
