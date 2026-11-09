import type { Metadata } from "next";
import { ServerConsole } from "@/components/server-console";

export const metadata: Metadata = {
  title: "Server · EUDR Console",
  description:
    "Symmetry field console for parcel capture, harvest records, and EUDR evidence.",
};

export default function ServerPage() {
  return <ServerConsole />;
}
