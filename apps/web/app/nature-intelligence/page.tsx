import type { Metadata } from "next";
import { NatureIntelligenceHub } from "@/components/nature-intelligence-hub";
import "./nature-viewer.css";

export const metadata: Metadata = {
  title: "Nature Intelligence",
  description:
    "Hub de capas satelitales Symmetry: fire/thermal FIRMS, deforestación Copernicus, territorio, alertas y evidencia verificable.",
};

export default function NatureIntelligencePage() {
  return <NatureIntelligenceHub />;
}
