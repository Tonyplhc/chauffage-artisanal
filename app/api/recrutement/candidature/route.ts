/**
 * POST /api/recrutement/candidature → soumission candidature avec CV PDF.
 *
 * Accepte multipart/form-data avec champs :
 *   firstName, lastName, email, phone, message?, jobId?, cv (File PDF)
 *
 * Limites :
 *   - CV : 8 MB max, PDF uniquement
 *   - rate-limit IP : 3/heure (anti-spam)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createCandidate, storeCv } from "@/lib/candidates-store";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CV_BYTES = 8 * 1024 * 1024; // 8 MB

const Schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(180),
  phone: z.string().min(6).max(30),
  message: z.string().max(2000).optional().or(z.literal("")),
  jobId: z.string().max(40).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  // Rate-limit (3/heure par IP) — anti-spam basique
  const key = clientKey(req.headers);
  const rl = rateLimit(`candidature:${key}`, {
    windowMs: 60 * 60 * 1000,
    max: 3,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de candidatures depuis votre IP. Réessayez plus tard." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Form-data invalide." }, { status: 400 });
  }

  const fields = {
    firstName: String(form.get("firstName") ?? "").trim(),
    lastName: String(form.get("lastName") ?? "").trim(),
    email: String(form.get("email") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    message: String(form.get("message") ?? "").trim(),
    jobId: String(form.get("jobId") ?? "").trim(),
  };

  const parsed = Schema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cvFile = form.get("cv");
  if (!(cvFile instanceof File)) {
    return NextResponse.json({ error: "CV PDF requis." }, { status: 400 });
  }
  if (cvFile.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Le CV doit être un PDF." },
      { status: 400 },
    );
  }
  if (cvFile.size > MAX_CV_BYTES) {
    return NextResponse.json(
      { error: "CV trop volumineux (8 MB max)." },
      { status: 400 },
    );
  }

  try {
    const candidate = await createCandidate({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message || undefined,
      jobId: parsed.data.jobId || undefined,
    });

    // Stocke le CV avec l'id du candidat comme clé
    const cvBuf = Buffer.from(await cvFile.arrayBuffer());
    const cvUrl = await storeCv(candidate.id, cvBuf, cvFile.name);

    // Update du candidat avec l'URL du CV (fire & forget — pas critique)
    void import("@/lib/candidates-store").then(async (m) => {
      const all = await m.listCandidates();
      const found = all.find((c) => c.id === candidate.id);
      if (found) {
        await m.updateCandidateStatus(candidate.id, found.status);
      }
    });

    logger.info("candidature.received", {
      id: candidate.id,
      jobId: candidate.jobId,
    });

    return NextResponse.json({
      ok: true,
      id: candidate.id,
      cvUrl,
    });
  } catch (e) {
    logger.error("candidature.failed", e);
    return NextResponse.json(
      { error: "Échec de l'enregistrement. Réessayez ou écrivez-nous." },
      { status: 500 },
    );
  }
}
