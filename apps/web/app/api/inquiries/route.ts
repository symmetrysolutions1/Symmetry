import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedServices = new Set(["nature", "eudr", "enterprise", "hybrid"]);
const fallbackEmail = "symmetrysolutions1@gmail.com";

type Inquiry = {
  name?: unknown;
  organization?: unknown;
  email?: unknown;
  service?: unknown;
  need?: unknown;
  consent?: unknown;
  website?: unknown;
};

function value(input: unknown, maxLength: number) {
  return typeof input === "string" ? input.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let input: Inquiry;
  try {
    input = (await request.json()) as Inquiry;
  } catch {
    return NextResponse.json({ message: "La solicitud no tiene un formato válido." }, { status: 400 });
  }

  if (value(input.website, 200)) {
    return NextResponse.json({ message: "Solicitud recibida." });
  }

  const inquiry = {
    name: value(input.name, 100),
    organization: value(input.organization, 140),
    email: value(input.email, 180).toLowerCase(),
    service: value(input.service, 30),
    need: value(input.need, 1800),
    consent: input.consent === "accepted",
    receivedAt: new Date().toISOString(),
    source: "symmetry-web",
  };

  if (
    !inquiry.name ||
    !inquiry.organization ||
    !EMAIL_PATTERN.test(inquiry.email) ||
    !allowedServices.has(inquiry.service) ||
    inquiry.need.length < 20 ||
    !inquiry.consent
  ) {
    return NextResponse.json(
      { message: "Revisa los campos requeridos y vuelve a intentarlo." },
      { status: 422 },
    );
  }

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;

  try {
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.LEADS_WEBHOOK_SECRET
            ? { authorization: `Bearer ${process.env.LEADS_WEBHOOK_SECRET}` }
            : {}),
        },
        body: JSON.stringify(inquiry),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        throw new Error(`Lead webhook returned ${response.status}`);
      }
    } else if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.LEADS_FROM_EMAIL || "Symmetry Web <onboarding@resend.dev>",
          to: [process.env.LEADS_TO_EMAIL || fallbackEmail],
          reply_to: inquiry.email,
          subject: `[Symmetry] ${inquiry.organization} · ${inquiry.service}`,
          text: [
            `Nombre: ${inquiry.name}`,
            `Empresa: ${inquiry.organization}`,
            `Email: ${inquiry.email}`,
            `Servicio: ${inquiry.service}`,
            "",
            inquiry.need,
          ].join("\n"),
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        throw new Error(`Resend returned ${response.status}`);
      }
    } else {
      return NextResponse.json(
        {
          message: `El canal automático aún no está configurado. Escríbenos a ${fallbackEmail}.`,
        },
        { status: 503 },
      );
    }
  } catch {
    return NextResponse.json(
      { message: `No pudimos entregar el mensaje. Escríbenos a ${fallbackEmail}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: "Recibimos tu solicitud. Nuestro equipo te contactará para el diagnóstico.",
  });
}
