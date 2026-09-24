import type { Metadata } from "next";
import Link from "next/link";
import { NatureIntelligenceConsole } from "@/components/nature-intelligence-console";
import "./console.css";

export const metadata: Metadata = { title: "Nature Intelligence Console", description: "Consola operacional para territorios, observaciones, alertas y evidencia." };
export default function NatureConsolePage() { return <main className="nature-console-page"><div className="shell"><div className="nature-console-heading"><div><span className="eyebrow">Nature Intelligence / Operations</span><h1>Territorio convertido en decisiones auditables.</h1><p>Observaciones Copernicus, cambios, validación humana y pasaportes de evidencia en una sola vista.</p></div><Link href="/nature-intelligence">Ver solución</Link></div><NatureIntelligenceConsole /></div></main>; }
