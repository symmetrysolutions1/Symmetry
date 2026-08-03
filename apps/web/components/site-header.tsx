"use client";

import Link from "next/link";
import { useState } from "react";
import { serviceLinks, trustLinks } from "@/lib/content";
import { Brand } from "./brand";
import { ArrowUpRight, CloseIcon, MenuIcon } from "./icons";

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 8">
      <path d="m1 1 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sym-header">
      <div className="sym-shell sym-header-inner">
        <Brand />
        <nav className="sym-desktop-nav" aria-label="Navegación principal">
          <div className="sym-nav-group">
            <Link className="sym-nav-trigger" href="/services">
              Servicios Symmetry <Chevron />
            </Link>
            <div className="sym-nav-menu sym-nav-menu-services">
              <div className="sym-nav-menu-intro">
                <span>Servicios</span>
                <strong>Tres frentes. Una misma capacidad de demostrar.</strong>
              </div>
              <div className="sym-nav-menu-links">
                {serviceLinks.map((item, index) => (
                  <Link href={item.href} key={item.href}>
                    <span>0{index + 1}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="sym-nav-group">
            <Link className="sym-nav-trigger" href="/trust-layer">
              Trust Layer <Chevron />
            </Link>
            <div className="sym-nav-menu sym-nav-menu-trust">
              {trustLinks.map((item) => (
                <Link href={item.href} key={item.href}>
                  <span className="sym-nav-orb" />
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <Link className="sym-header-cta" href="/contact">
          Hablemos <ArrowUpRight />
        </Link>
        <button
          className="sym-menu-button"
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      <div className={`sym-mobile-panel ${open ? "is-open" : ""}`}>
        <div className="sym-shell">
          <Link className="sym-mobile-parent" href="/services" onClick={() => setOpen(false)}>
            Servicios Symmetry
          </Link>
          {serviceLinks.map((item, index) => (
            <Link
              className="sym-mobile-child"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link className="sym-mobile-parent" href="/trust-layer" onClick={() => setOpen(false)}>
            Trust Layer
          </Link>
          <Link
            className="sym-mobile-child"
            href="/trust-layer"
            onClick={() => setOpen(false)}
          >
            <span>01</span>
            Nuestra tecnología
          </Link>
          <Link className="sym-mobile-contact" href="/contact" onClick={() => setOpen(false)}>
            Iniciar conversación <ArrowUpRight />
          </Link>
        </div>
      </div>
    </header>
  );
}
