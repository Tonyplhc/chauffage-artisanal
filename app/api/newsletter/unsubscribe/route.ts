import { NextResponse } from "next/server";
import { unsubscribe, verifyNewsletterToken } from "@/lib/newsletter-store";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("t");
  const baseUrl = `${url.protocol}//${url.host}`;

  if (!email || !verifyNewsletterToken(email, "unsubscribe", token ?? undefined)) {
    return NextResponse.redirect(`${baseUrl}/newsletter/desinscrit?ok=0`);
  }
  const entry = await unsubscribe(email);
  if (!entry) {
    return NextResponse.redirect(`${baseUrl}/newsletter/desinscrit?ok=0`);
  }
  logger.info("newsletter.unsubscribed", { email });
  return NextResponse.redirect(`${baseUrl}/newsletter/desinscrit?ok=1`);
}
