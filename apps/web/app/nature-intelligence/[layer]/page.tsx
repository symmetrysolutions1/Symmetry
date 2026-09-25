import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NatureIntelligenceHub } from "@/components/nature-intelligence-hub";
import "../nature-viewer.css";

const layerSlugs = ["fire-risk", "deforestation-lines", "water-flow"];

export const metadata: Metadata = {
  title: "Nature Intelligence · Capa territorial",
  description: "Visor directo de las capas de interpretación de Nature Intelligence.",
};

export default async function NatureLayerPopupPage({
  params,
}: {
  params: Promise<{ layer: string }>;
}) {
  const { layer } = await params;
  if (!layerSlugs.includes(layer)) notFound();
  return <NatureIntelligenceHub />;
}
