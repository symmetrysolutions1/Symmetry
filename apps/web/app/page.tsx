"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ArrowRight,
  CloseIcon,
  GlobeIcon,
  LayersIcon,
  LeafIcon,
  MenuIcon,
  ShieldIcon,
  WorkflowIcon,
} from "@/components/icons";
import styles from "./symmetry-landing.module.css";

const capabilities = [
  {
    icon: LeafIcon,
    number: "01",
    title: "EUDR - ESG",
    description:
      "Debida diligencia, evidencia geoespacial y cumplimiento para exportar productos libres de deforestación.",
  },
  {
    icon: GlobeIcon,
    number: "02",
    title: "Nature Intelligence System",
    description:
      "Natura Intelligence conecta territorio, clima, biodiversidad y decisiones de alto impacto.",
  },
  {
    icon: WorkflowIcon,
    number: "03",
    title: "Automatización y verificación",
    description:
      "Reglas, permisos y procesos empresariales que dejan una historia comprobable.",
  },
  {
    icon: ShieldIcon,
    number: "04",
    title: "Trazabilidad end to end",
    description:
      "Del origen del producto o activo a su certificación, transferencia y auditoría.",
  },
] as const;

const team = [
  { name: "Dirección", role: "Espacio reservado" },
  { name: "Tecnología", role: "Espacio reservado" },
  { name: "Territorio", role: "Espacio reservado" },
  { name: "Operaciones", role: "Espacio reservado" },
  { name: "Alianzas", role: "Espacio reservado" },
] as const;

const partners = [
  "Socio estratégico",
  "Institución",
  "Aliado tecnológico",
  "Cooperación",
] as const;

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -7% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateHeader = () => {
      const isVisible = window.scrollY > 32;
      setHeaderVisible(isVisible);
      if (!isVisible) setMenuOpen(false);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={`symmetry-we-page ${styles.page}`}>
      <header
        className={`${styles.header} ${headerVisible ? styles.headerVisible : styles.headerInitial}`}
      >
        <Link href="#inicio" className={styles.logoLink} aria-label="Symmetry Enterprises, inicio">
          <Image
            src="/brand/symmetry-identity.png"
            alt="Symmetry Enterprises"
            width={1536}
            height={1536}
            loading="eager"
          />
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Secciones">
          <div className={styles.navMobileTop}>
            <Link href="/contact" onClick={closeMenu}>
              <span>Hablemos</span>
            </Link>
          </div>
          <a href="#inicio" onClick={closeMenu}>Inicio</a>
          <a href="#nosotros" onClick={closeMenu}>Nosotros</a>
          <a href="#capacidades" onClick={closeMenu}>Capacidades</a>
          <a href="#confianza" onClick={closeMenu}>Confianza</a>
          <Link href="/contact" className={styles.navApp} onClick={closeMenu}>Contacto</Link>
        </nav>

        <Link href="/contact" className={styles.enterButton}>Hablemos</Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      <section className={styles.hero} id="inicio">
        <div className={styles.heroCopy} data-reveal>
          <div className={styles.heroLead}>
            <p className={styles.kicker}>
              <span>Trazabilidad</span>
              <span>Verificación</span>
              <span>Blockchain</span>
            </p>
          </div>
          <h1>
            <span className={styles.heroLine}>Convertimos</span>
            <span className={styles.heroLine}>la información</span>
            <span className={styles.heroLine}>
              <strong className={styles.heroAccent}>Geoespacial</strong> en
            </span>
            <em className={styles.heroLine}>Trazabilidad</em>
            <em className={styles.heroLine}>Verificable</em>
            <strong className={`${styles.heroLine} ${styles.heroAccent}`}>
              para el EUDR
            </strong>
          </h1>
          <p>
            Integramos georreferenciación de parcelas, información satelital y evidencia
            territorial para demostrar el origen de productos libres de deforestación.
          </p>
          <div className={styles.heroActions}>
            <Link href="/solutions/eudr" className={styles.goldButton}>
              Conocer app <ArrowRight />
            </Link>
          </div>
        </div>

        <div className={styles.heroArt} data-reveal>
          <Image
            src="/brand/symmetry-enterprises-overview-v2.png"
            alt="Ecosistema de trazabilidad de Symmetry Enterprises en el bosque"
            width={1448}
            height={1086}
            priority
            sizes="(max-width: 620px) calc(100vw - 44px), (max-width: 960px) 80vw, (max-width: 1440px) 58vw, 860px"
          />
        </div>

        <a href="#nosotros" className={styles.scrollCue} aria-label="Ver la siguiente sección">
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className={styles.intro} id="nosotros">
        <div className={styles.aboutIntro} data-reveal>
          <p className={styles.sectionLabel}>Nosotros · Lo que hacemos</p>
          <p>
            Symmetry Enterprises construye infraestructura de confianza para demostrar el
            origen, la integridad y la evolución de productos, la protección de la
            deforestación en los territorios y la automatización de operaciones empresariales.
          </p>
        </div>

        <article className={styles.storyRow} data-reveal>
          <div className={styles.storyImage}>
            <Image
              src="/brand/symmetry-enterprises-overview-v2.png"
              alt="Trazabilidad EUDR y verificación territorial"
              width={980}
              height={801}
              style={{ objectPosition: "78% center" }}
            />
          </div>
          <div className={styles.storyCopy}>
            <span>01</span>
            <LeafIcon className={styles.storyIcon} />
            <h2>Natura Intelligence System para clima, biodiversidad y diplomacia</h2>
            <p>
              Una capa de operación territorial para gobiernos, naciones participantes en
              las COP y empresas comprometidas con objetivos ambientales.
            </p>
          </div>
        </article>

        <article className={`${styles.storyRow} ${styles.storyRowReverse}`} data-reveal>
          <div className={styles.storyImage}>
            <Image
              src="/brand/symmetry-enterprises-overview-v2.png"
              alt="Natura Intelligence System y monitoreo del territorio"
              width={980}
              height={801}
              style={{ objectPosition: "50% center" }}
            />
          </div>
          <div className={styles.storyCopy}>
            <span>02</span>
            <GlobeIcon className={styles.storyIcon} />
            <h2>EUDR y trazabilidad para productos libres de deforestación</h2>
            <p>
              Acompañamos a exportadores hacia la Unión Europea con georreferenciación,
              evidencia satelital, debida diligencia y cumplimiento verificable.
            </p>
          </div>
        </article>

        <article className={styles.storyRow} data-reveal>
          <div className={styles.storyImage}>
            <Image
              src="/brand/symmetry-enterprises-overview-v2.png"
              alt="Automatización y operaciones empresariales mediante blockchain"
              width={980}
              height={801}
              style={{ objectPosition: "20% center" }}
            />
          </div>
          <div className={styles.storyCopy}>
            <span>03</span>
            <LayersIcon className={styles.storyIcon} />
            <h2>Enterprise & Blockchain Operations</h2>
            <p>
              Automatizamos procesos, certificamos o tokenizamos activos y construimos
              trazabilidad operativa para el onboarding empresarial hacia blockchain.
            </p>
          </div>
        </article>
      </section>

      <section className={styles.solutions} id="capacidades">
        <div className={styles.solutionsLayout}>
          <div className={styles.ecosystemImage}>
            <Image
              src="/brand/symmetry-forest-texture.png"
              alt="Bosque monitoreado por las capacidades de Symmetry Enterprises"
              width={1536}
              height={1024}
            />
          </div>

          <div className={styles.solutionsHeader}>
            <p className={styles.sectionLabel}>Capacidades de Symmetry Enterprise</p>
            <h2>Una arquitectura para evidenciar, verificar y operar.</h2>
            <p>
              Cada capacidad conecta datos del mundo real con controles digitales y una
              evidencia que puede auditarse.
            </p>
          </div>

          <div className={styles.solutionList}>
            {capabilities.map(({ icon: Icon, ...item }) => (
              <article key={item.number} className={styles.solutionItem}>
                <div className={styles.solutionIcon}>
                  <Icon />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <ArrowRight />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.tokenSection} id="confianza">
        <div className={styles.tokenArtwork} data-reveal>
          <Image
            src="/brand/symmetry-blockchain-v2.png"
            alt="Infraestructura blockchain de Symmetry Enterprises"
            fill
            sizes="(max-width: 960px) 50vw, 50vw"
          />
        </div>

        <div className={styles.tokenCopy} data-reveal>
          <p className={styles.sectionLabel}>Blockchain y ciberseguridad</p>
          <p>
            Nuestra Trust Layer registra identidad corporativa, permisos, certificaciones,
            trazabilidad y auditoría sin quitarle a cada empresa el control de su operación.
          </p>
          <p>
            La ciberseguridad protege accesos, integraciones y continuidad; blockchain
            conserva la integridad de la evidencia compartida entre las partes.
          </p>
          <p>
            Así construimos confianza entre territorio, empresas, reguladores y mercados.
          </p>
          <Link href="/trust-layer" className={styles.goldButton}>
            Explorar Trust Layer <ArrowRight />
          </Link>
        </div>
      </section>

      <section className={styles.teamSection} id="equipo">
        <div className={styles.teamHeading} data-reveal>
          <p className={styles.sectionLabel}>Las personas detrás de Symmetry</p>
        </div>

        <div className={styles.teamGrid}>
          {team.map((member) => (
            <article className={styles.teamCard} key={member.name} data-reveal>
              <div className={styles.teamPortrait}>
                <Image
                  src="/brand/symmetry-identity.png"
                  alt={`Espacio reservado para ${member.name}`}
                  width={564}
                  height={564}
                />
              </div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.partners}>
        <div className={styles.partnerGrid} aria-label="Plantilla de organizaciones aliadas">
          <p>Nuestros<br />socios</p>
          {partners.map((partner) => (
            <div className={styles.partnerLogo} key={partner}>
              <Image
                src="/brand/symmetry-identity.png"
                alt={`Espacio reservado: ${partner}`}
                width={1536}
                height={1536}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.videoCta}>
        <div className={styles.videoVisual}>
          <Image
            src="/brand/symmetry-build-cta-v2.png"
            alt="Automatización, verificación, trazabilidad y cumplimiento con Symmetry Enterprises"
            fill
            sizes="(max-width: 700px) 58vw, 55vw"
            className={styles.videoBackground}
          />
          <div className={styles.videoSphere} aria-hidden="true">
            <Image
              src="/brand/symmetry-identity.png"
              alt=""
              fill
              sizes="210px"
            />
          </div>
        </div>
        <div className={styles.videoContent} data-reveal>
          <h2 className={styles.ctaTitle}>Ready to build with Symmetry?</h2>
          <p>Cuéntanos qué producto, territorio o proceso necesitan demostrar.</p>
          <p>
            Construyamos la trazabilidad y la evidencia que conecten su operación con el
            siguiente mercado.
          </p>
          <Link href="/contact" className={styles.goldButton}>
            Hablemos <ArrowRight />
          </Link>
        </div>
      </section>

      <footer className={styles.footer} id="contacto">
        <div className={styles.footerBrand}>
          <Image
            src="/brand/symmetry-identity.png"
            alt="Symmetry Enterprises"
            width={1536}
            height={1536}
          />
          <p>Trazabilidad, verificación y confianza<br />para conectar el mundo real.</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="#inicio">Inicio</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#capacidades">Capacidades</a>
          <Link href="/contact">Contacto</Link>
        </div>
        <div className={styles.footerMeta}>
          <p>Cali, Colombia · Operación global</p>
          <p>© 2026 Symmetry Enterprises</p>
        </div>
      </footer>
    </div>
  );
}
