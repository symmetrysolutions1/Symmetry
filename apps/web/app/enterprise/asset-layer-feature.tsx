"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export function EnterpriseAssetFeature() {
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const closePreview = () => {
    setIsCardFlipped(false);
  };

  const flipCardIntoPreview = () => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsCardFlipped(true);
  };

  useEffect(() => {
    if (!isCardFlipped) {
      openerRef.current?.focus();
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCardFlipped]);

  return (
    <>
      <section className="section enterprise-asset-feature">
        <div className="shell enterprise-asset-grid">
          <div className={`asset-core-visual${isCardFlipped ? " is-flipped" : ""}`}>
            <div
              className="asset-core-visual-front"
              role="button"
              tabIndex={0}
              aria-label="Girar el pasaporte y mostrar Asset Layer aquí"
              aria-hidden={isCardFlipped}
              onClick={flipCardIntoPreview}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  flipCardIntoPreview();
                }
              }}
            >
              <div className="asset-core-orbit asset-core-orbit-one" aria-hidden="true" />
              <div className="asset-core-orbit asset-core-orbit-two" aria-hidden="true" />
              <div className="asset-core-mark" aria-hidden="true">∞</div>
              <div className="asset-core-record asset-passport-front">
                <span className="asset-record-topline"><span>ASSET PASSPORT</span><strong>VERIFIED PATH</strong></span>
                <strong className="asset-record-id">PET-000184</strong>
                <span className="asset-record-fields">
                  <span>Material <b>PET / recyclable</b></span>
                  <span>Quantity <b>10,000 kg</b></span>
                  <span>Origin <b>Cali / Colombia</b></span>
                </span>
                <span className="asset-record-line" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                <span className="asset-record-foot"><span>REGISTER</span><span>VERIFY</span><span>TRANSFORM</span></span>
              </div>
            </div>
            <div className="asset-core-visual-back" aria-hidden={!isCardFlipped}>
              <header className="asset-core-visual-header">
                <div>
                  <span className="eyebrow">ASSET LAYER · RADIAN</span>
                  <strong>VISOR INTEGRADO</strong>
                </div>
                <button
                  className="asset-core-visual-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    closePreview();
                  }}
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Volver al pasaporte"
                >
                  ×
                </button>
              </header>
              {isCardFlipped ? (
                <iframe
                  className="asset-core-visual-frame"
                  src="/asset-layer"
                  title="Asset Layer dentro del pasaporte digital"
                />
              ) : null}
            </div>
          </div>

          <div className="enterprise-asset-copy">
            <span className="eyebrow eyebrow-light enterprise-asset-proof-label">
              <strong>01 / Asset Layer</strong><span>· PROOF OF CONCEPT</span><em>RADIAN</em>
            </span>
            <h2>La hoja de vida digital del material.</h2>
            <p>
              Asset Layer empieza por el activo físico: qué existe, cuánto hay, de dónde viene,
              quién lo custodia, quién lo verificó y qué ocurrió con él después.
            </p>
            <p>
              Es la primera historia que una empresa puede consultar antes de conectar sus
              operaciones con compradores, reportes, compliance o futuras rutas de valor.
            </p>
            <div className="enterprise-asset-actions">
              <Link className="button button-light" href="/asset-layer">
                Explorar Asset Layer <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
