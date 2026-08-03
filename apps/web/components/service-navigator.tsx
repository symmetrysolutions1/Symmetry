"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight } from "./icons";

const needs = [
  {
    id: "territory",
    number: "01",
    label: "Monitorear un territorio",
    title: "Nature Intelligence",
    copy: "Copernicus, observaciones, alertas y pasaportes de evidencia ambiental.",
    href: "/solutions/nature-intelligence",
    accent: "lime",
  },
  {
    id: "supply",
    number: "02",
    label: "Demostrar origen libre de deforestación",
    title: "EUDR",
    copy: "Parcelas, lotes, custodia, debida diligencia y certificados verificables.",
    href: "/solutions/eudr",
    accent: "orange",
  },
  {
    id: "governance",
    number: "03",
    label: "Validar decisiones corporativas",
    title: "VotoID",
    copy: "Juntas, propuestas, quórum, votos, ejecución y evidencia auditable.",
    href: "/solutions/enterprise",
    accent: "blue",
  },
  {
    id: "process",
    number: "04",
    label: "Automatizar un proceso crítico",
    title: "Enterprise Automation",
    copy: "Aprobaciones, checkpoints, integraciones y trazabilidad institucional.",
    href: "/solutions/enterprise",
    accent: "sand",
  },
];

export function ServiceNavigator() {
  const [selected, setSelected] = useState(needs[0]);
  const [isPending, startTransition] = useTransition();

  function selectNeed(item: (typeof needs)[number]) {
    startTransition(() => setSelected(item));
  }

  return (
    <div className="navigator-grid">
      <div className="navigator-options" role="tablist" aria-label="Necesidades operativas">
        {needs.map((item) => (
          <button
            className={selected.id === item.id ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={selected.id === item.id}
            key={item.id}
            onClick={() => selectNeed(item)}
          >
            <span>{item.number}</span>
            {item.label}
            <ArrowRight />
          </button>
        ))}
      </div>
      <div
        className={`navigator-result accent-${selected.accent} ${isPending ? "is-pending" : ""}`}
        role="tabpanel"
      >
        <span className="eyebrow">Ruta recomendada</span>
        <div className="navigator-orbit" aria-hidden="true">
          <span />
          <span />
          <i />
        </div>
        <div>
          <h3>{selected.title}</h3>
          <p>{selected.copy}</p>
          <Link className="text-link" href={selected.href}>
            Explorar solución <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
