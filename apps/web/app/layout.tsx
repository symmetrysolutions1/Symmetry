import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Symmetry Enterprises | La evidencia permanece",
    template: "%s | Symmetry",
  },
  description:
    "Symmetry conecta EUDR, trazabilidad, Natura Intelligence y operaciones empresariales para convertir evidencia en confianza verificable.",
  openGraph: {
    title: "Symmetry Enterprises | La evidencia permanece",
    description:
      "Tres frentes operativos y una capa de confianza para proteger el valor de lo que ocurre.",
    type: "website",
    locale: "es_CO",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
