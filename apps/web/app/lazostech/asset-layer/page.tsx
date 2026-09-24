import type { Metadata } from "next";
import { AssetLayerConsole } from "@/components/asset-layer-console";

export const metadata: Metadata = {
  title: "LazosTech Asset Layer",
  description: "Consola piloto de trazabilidad y certificación de lotes PET para LazosTech.",
};

export default function LazosTechAssetLayerPage() {
  return <AssetLayerConsole />;
}
