import type { Metadata } from "next";
import { NatureIntelligenceHub } from "@/components/nature-intelligence-hub";
import "./nature-viewer.css";

export const metadata: Metadata = {
  title: "Nature Intelligence",
  description:
    "Información satelital para la preservación de la naturaleza: Fire Risk alert, Deforestation Lines y WaterFlow.",
};

export default function NatureIntelligencePage() {
  return <NatureIntelligenceHub />;
}
