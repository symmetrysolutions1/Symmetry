import type { Metadata } from "next";
import { ServerConsole } from "@/components/server-console";

export const metadata: Metadata = {
  title: "Server · EUDR Console",
  description:
    "Consola de Symmetry para cargar parcelas, registrar cosechas y preparar evidencia EUDR.",
};

export default function ServerPage() {
  return <ServerConsole />;
}
