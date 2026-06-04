import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type Role,
} from "@/lib/users-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RoleSchema = z.enum(["admin", "commercial", "viewer"]);

const CreateSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(8).max(200),
  role: RoleSchema,
});

const PatchSchema = z.object({
  id: z.string().min(1).max(40),
  role: RoleSchema.optional(),
  password: z.string().min(8).max(200).optional(),
  capabilities: z.array(z.string().min(1).max(80)).max(200).optional(),
  displayName: z.string().max(80).optional(),
});

export async function GET(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] as Role[] });
  if (!auth.ok) return auth.response;
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] as Role[] });
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const user = await createUser(
      parsed.data.email,
      parsed.data.password,
      parsed.data.role,
    );
    logger.info("admin.user_created", { email: user.email, role: user.role });
    void logActivity(
      "auth.login",
      `Utilisateur créé · ${user.email} (${user.role})`,
      { meta: { email: user.email, role: user.role } },
    );
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] as Role[] });
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  try {
    const user = await updateUser(parsed.data.id, {
      role: parsed.data.role,
      password: parsed.data.password,
      capabilities: parsed.data.capabilities,
      displayName: parsed.data.displayName,
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    void logActivity("auth.login", `Utilisateur modifié · ${user.email}`, {
      meta: { email: user.email },
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] as Role[] });
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }
  const ok = await deleteUser(id);
  if (!ok) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  void logActivity("auth.login", `Utilisateur supprimé · id=${id}`);
  return NextResponse.json({ ok: true });
}
