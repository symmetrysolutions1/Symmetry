import type { Metadata } from "next";
import { EudrMaritimeConsole } from "@/components/eudr/eudr-maritime-console";

export const metadata: Metadata = {
  title: "EUDR",
  description:
    "Debida diligencia EUDR con evidencia territorial y contexto de rutas marítimas comerciales.",
};

export default function EudrPage() {
  return <EudrMaritimeConsole />;
}
