"use client";

import { useEffect, useRef, type SVGProps } from "react";
import { LayersIcon, ShieldIcon } from "@/components/icons";

function BallotUrnIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 25h32v16H8z" />
      <path d="m5 25 4-5h30l4 5H5Z" />
      <path d="M18 22h12" />
      <path d="m18 19 10-12 10 8-10 12-10-8Z" />
      <path d="m24 14 5-1m-4 5 2 2 4-5" />
      <path d="M31 12c1.5-1.2 3-.8 3.5.1.4.8.1 1.6-.7 2.2l-2 1.6 3.2-.8c1.1-.3 2 .3 2.2 1.2.2.9-.4 1.7-1.3 2l-4.2 1.2-3.5 3.6" />
      <path d="M15 32h18m-14 5h10" />
    </svg>
  );
}

function RoboticArmIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="32" height="25" rx="2" />
      <path d="M17 32v4m6-7v7m-10 4h19M9 9h4" />
      <circle cx="20" cy="18" r="6.5" />
      <circle cx="20" cy="18" r="2.3" />
      <path d="M18.5 8.5h3v3h-3zM18.5 24.5h3v3h-3zM10.5 16.5h3v3h-3zM26.5 16.5h3v3h-3z" />
      <path d="m14 11 3 3m6 8 3 3m-12 0 3-3m6-6 3-3" />
      <path d="M42 42h-7l-2-4 4-7-4-6" />
      <circle cx="35" cy="38" r="2" />
      <circle cx="37" cy="31" r="2" />
      <path d="m31 27-2-2m5 0 2-2" />
      <path d="M25 10c1.3.5 2.3 1.6 2.8 2.9m0 0-2.7-.2m2.7.2.1-2.7" />
    </svg>
  );
}

function ContainerShipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 29h42l-6 9H14C8 38 5 35 3 29Z" />
      <path d="M5 33h36M39 38H14" />
      <path d="M6 18h7v11H6zM15 13h8v16h-8zM25 17h8v12h-8zM35 20h6v9h-6z" />
      <path d="M9 18v11m9-16v16m4-16v16m-7-11h8m2 4h8m-8 4h8m2-9h6m-6 4h6" />
      <path d="M6 18v-3h7v3m2-5V9h8v4m2 4v-3h8v3" />
      <path d="M3 43c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 4 1.5 6 0 4-1.5 6 0 4 1.5 6 0 4-1.5 6 0" />
      <path d="M9 46c2-1.3 4-1.3 6 0s4 1.3 6 0 4-1.3 6 0 4 1.3 6 0 4-1.3 6 0" />
    </svg>
  );
}

const services = [
  {
    number: "01",
    label: "ASSET LAYER",
    title: "Trazabilidad de materiales",
    description: "Pasaporte digital del lote: identidad, origen, custodia, transformación y evidencia verificable.",
    maturity: "PILOTO CONTROLADO · BASE SEPOLIA",
    icon: LayersIcon,
    tone: "orange",
  },
  {
    number: "02",
    label: "VotoID",
    title: "Decisiones institucionales",
    description: "Juntas, miembros, quórum, votaciones y ejecución con permisos y registro auditable.",
    maturity: "E2E · LOCAL — TESTNET SEPOLIA",
    icon: BallotUrnIcon,
    tone: "orange",
  },
  {
    number: "03",
    label: "Automation",
    title: "Procesos y estados",
    description: "Orquesta tareas, aprobaciones y estados; conserva evidencia y escala acciones sensibles.",
    maturity: "E2E · LOCAL — TESTNET SEPOLIA",
    icon: RoboticArmIcon,
    tone: "orange",
  },
  {
    number: "04",
    label: "EUDR",
    title: "Debida diligencia",
    description: "Organiza proveedores, trazabilidad de cadena y evidencia para revisión de debida diligencia.",
    maturity: "E2E · LOCAL — TESTNET SEPOLIA",
    icon: ContainerShipIcon,
    tone: "orange",
  },
  {
    number: "05",
    label: "Resolve",
    title: "Agente operativo con límites",
    description: "Atiende solicitudes autorizadas, prepara acciones y evidencia, y pide aprobación para operaciones sensibles.",
    maturity: "TECH SENIOR AGENT",
    icon: ShieldIcon,
    tone: "orange",
  },
];

export function EnterprisePortfolioCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      if (pauseRef.current) return;
      const firstCard = viewport.querySelector<HTMLElement>("[data-portfolio-cube]");
      if (!firstCard) return;

      const track = viewport.querySelector<HTMLElement>(".enterprise-portfolio-track");
      if (!track) return;
      const gap = track ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0 : 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const end = viewport.scrollWidth - viewport.clientWidth;
      if (viewport.scrollLeft >= end - 1) return;
      viewport.scrollTo({ left: Math.min(viewport.scrollLeft + step, end), behavior: "smooth" });
    }, 3400);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="enterprise-portfolio-viewport"
      ref={viewportRef}
      role="region"
      aria-label="Servicios de Enterprise Operations"
      aria-roledescription="carrusel"
      aria-live="off"
      onPointerEnter={() => { pauseRef.current = true; }}
      onPointerLeave={() => { pauseRef.current = false; }}
      onPointerDown={() => { pauseRef.current = true; }}
      onPointerUp={() => { pauseRef.current = false; }}
    >
      <div className="enterprise-portfolio-track">
        {services.map(({ number, label, title, description, maturity, icon: Icon, tone }) => (
          <article
            className={`enterprise-portfolio-card enterprise-portfolio-${tone}`}
            data-portfolio-cube
            aria-label={`${label}: ${title}. ${description}`}
            key={number}
          >
            <div className="portfolio-card-top"><span>{number}</span><Icon /></div>
            <span className="eyebrow">— {label}</span>
            <h3>{title}</h3>
            <p className="portfolio-cube-detail">{description}</p>
            <span className="portfolio-maturity">{maturity}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
