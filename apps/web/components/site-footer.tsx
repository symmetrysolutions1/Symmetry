import Link from "next/link";
import { companyEmail, serviceLinks } from "@/lib/content";
import { Brand } from "./brand";
import { ArrowUpRight } from "./icons";

export function SiteFooter() {
  return (
    <footer className="sym-footer">
      <div className="sym-shell sym-footer-top">
        <div className="sym-footer-statement">
          <Brand />
          <p>La realidad cambia. La evidencia permanece.</p>
        </div>
        <div className="sym-footer-column">
          <span>Servicios</span>
          <Link href="/services">Visión general</Link>
          {serviceLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="sym-footer-column">
          <span>Confianza</span>
          <Link href="/trust-layer">Trust Layer</Link>
          <Link href="/proof">Casos de éxito</Link>
          <Link href="/privacy">Privacidad</Link>
          <a href="https://github.com/symmetrysolutions1/Symmetry" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight />
          </a>
        </div>
        <div className="sym-footer-contact">
          <span>Construyamos una verdad que permanezca.</span>
          <a href={`mailto:${companyEmail}`}>{companyEmail}</a>
        </div>
      </div>
      <div className="sym-shell sym-footer-base">
        <span>© {new Date().getFullYear()} Symmetry Enterprises</span>
        <span>Cali, Colombia · Operación global</span>
      </div>
    </footer>
  );
}
