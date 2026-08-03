"use client";

import { FormEvent, useState, useTransition } from "react";
import { companyEmail } from "@/lib/content";
import { ArrowRight, CheckIcon } from "./icons";

type FormStatus =
  | { kind: "idle"; message: "" }
  | { kind: "success" | "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      setStatus({ kind: "idle", message: "" });
      try {
        const response = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = (await response.json()) as { message?: string };
        if (!response.ok) {
          throw new Error(result.message || "No pudimos enviar el diagnóstico.");
        }
        form.reset();
        setStatus({
          kind: "success",
          message: result.message || "Recibimos tu solicitud. Te contactaremos pronto.",
        });
      } catch (error) {
        setStatus({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "No pudimos enviar el diagnóstico. Escríbenos directamente.",
        });
      }
    });
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          Nombre
          <input name="name" autoComplete="name" required maxLength={100} />
        </label>
        <label>
          Empresa
          <input name="organization" autoComplete="organization" required maxLength={140} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Email corporativo
          <input name="email" type="email" autoComplete="email" required maxLength={180} />
        </label>
        <label>
          Área de interés
          <select name="service" defaultValue="nature">
            <option value="nature">Nature Intelligence</option>
            <option value="eudr">EUDR</option>
            <option value="enterprise">VotoID / Automation</option>
            <option value="hybrid">Solución combinada</option>
          </select>
        </label>
      </div>
      <label>
        ¿Qué necesitas verificar, automatizar o demostrar?
        <textarea name="need" rows={5} required minLength={20} maxLength={1800} />
      </label>
      <label className="honeypot" aria-hidden="true">
        Sitio web
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="consent">
        <input name="consent" type="checkbox" value="accepted" required />
        <span>
          Autorizo a Symmetry a usar estos datos únicamente para responder esta solicitud.
        </span>
      </label>
      <button className="button button-dark submit-button" type="submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Solicitar diagnóstico"}
        {status.kind === "success" ? <CheckIcon /> : <ArrowRight />}
      </button>
      {status.kind !== "idle" ? (
        <p className={`form-status ${status.kind}`} role="status">
          {status.message}{" "}
          {status.kind === "error" ? <a href={`mailto:${companyEmail}`}>{companyEmail}</a> : null}
        </p>
      ) : null}
    </form>
  );
}
