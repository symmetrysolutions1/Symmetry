const successCases = [
  {
    id: "lazostech",
    wordmark: "LAZOSTECH",
    mark: "L",
    stage: "PILOTO · ASSET LAYER",
    title: "Trazabilidad de materiales",
    description:
      "Un pasaporte digital para seguir el origen, la custodia, la transformación y la evidencia de cada material.",
  },
  {
    id: "e14",
    wordmark: "E14",
    mark: "E14",
    stage: "PROYECTO INDEPENDIENTE",
    title: "Auditoría ciudadana",
    description:
      "Una aplicación para capturar formularios, revisar datos y documentar inconsistencias con apoyo de OCR.",
  },
  {
    id: "gruponorth",
    wordmark: "GRUPO NORTH",
    mark: "GN",
    stage: "SOLUCIÓN A MEDIDA",
    title: "Experiencia digital",
    description:
      "Una experiencia de usuario hecha a la medida para acercar servicios y facilitar la operación diaria.",
  },
  {
    id: "radian",
    wordmark: "RADIAN",
    mark: "R",
    stage: "DISEÑO · INTEGRACIÓN OPCIONAL",
    title: "Conciliación de facturas",
    description:
      "Una capa para conciliar referencias y evidencias de facturas electrónicas. RADIAN conserva su función como registro legal; el adaptador aún no está conectado.",
  },
  {
    id: "platform-flows",
    wordmark: "VotoID + Automation",
    mark: "V+A",
    stage: "FLUJOS E2E",
    title: "Decisiones y procesos",
    description:
      "Interfaces para organizar votaciones, miembros, tareas y aprobaciones con estados y registros auditables.",
  },
] as const;

export function EnterprisePortfolioCarousel() {
  return (
    <div
      className="enterprise-case-cubes"
      role="list"
      aria-label="Casos de éxito de Symmetry Operations"
    >
      {successCases.map(({ id, wordmark, mark, stage, title, description }) => (
        <article className={`enterprise-case-cube enterprise-case-cube-${id}`} key={id} role="listitem">
          <div className="enterprise-case-logo" role="img" aria-label={`Marca tipográfica ${wordmark}`}>
            <span className="enterprise-case-mark">{mark}</span>
            <span className="enterprise-case-wordmark">{wordmark}</span>
          </div>
          <span className="enterprise-case-stage">{stage}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </article>
      ))}
    </div>
  );
}
