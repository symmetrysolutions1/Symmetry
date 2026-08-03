import Link from "next/link";
import { ArrowRight } from "./icons";

type SolutionHeroProps = {
  eyebrow: string;
  title: string;
  copy: string;
  signal: string;
  tone: "nature" | "enterprise" | "eudr";
};

export function SolutionHero({ eyebrow, title, copy, signal, tone }: SolutionHeroProps) {
  return (
    <section className={`solution-hero solution-${tone}`}>
      <div className="shell solution-hero-grid">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="solution-lede">{copy}</p>
          <div className="hero-actions">
            <Link className="button button-light" href="/contact">
              Diseñar una implementación <ArrowRight />
            </Link>
            <Link className="button button-ghost-light" href="/proof">
              Ver infraestructura
            </Link>
          </div>
        </div>
        <div className="solution-signal" aria-label={signal}>
          <span className="signal-label">Señal operativa</span>
          <strong>{signal}</strong>
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
        </div>
      </div>
    </section>
  );
}
