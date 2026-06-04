import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./auth";

// Type inféré du retour de verifySession (Session non exporté pour préserver
// l'encapsulation côté auth.ts — on l'infère ici via ReturnType).
type Session = NonNullable<ReturnType<typeof verifySession>>;

/**
 * Gardes d'authentification pour /admin.
 *
 * Deux APIs coexistent dans le codebase :
 *   1. `requireAdminApi(req)` async → `{ ok: boolean, response: NextResponse, session?: Session }`
 *      Pattern utilisé par la quasi-totalité des routes admin créées depuis V11+ :
 *      ```ts
 *      const auth = await requireAdminApi(req);
 *      if (!auth.ok) return auth.response;
 *      ```
 *   2. `getAdminSession()` sync → `Session | null`
 *      Pour les Server Components et les routes qui veulent juste lire la session.
 *
 * L'argument `req` n'est plus utilisé (les cookies sont lus via `next/headers`)
 * mais on le garde optionnel pour ne pas casser les appelants.
 */

export function getAdminSession(): Session | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export type RequireAdminResult =
  | { ok: true; session: Session; response: NextResponse }
  | { ok: false; response: NextResponse; session?: undefined };

/**
 * Garde async pour les routes API admin. Compatible `await`.
 *
 * Usage :
 * ```ts
 * export async function GET(req: Request) {
 *   const auth = await requireAdminApi(req);
 *   if (!auth.ok) return auth.response;
 *   // ... auth.session disponible si besoin
 * }
 * ```
 */
export type RequireAdminOptions = {
  /** Restreint l'accès à certains rôles (legacy). Compatible avec capabilities. */
  roles?: string[];
};

export async function requireAdminApi(
  _req?: Request,
  options?: RequireAdminOptions,
): Promise<RequireAdminResult> {
  const session = getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 },
      ),
    };
  }
  // Vérification optionnelle du rôle (legacy)
  if (options?.roles && options.roles.length > 0) {
    const role = (session as { role?: string }).role;
    if (!role || !options.roles.includes(role)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Accès refusé pour ce rôle." },
          { status: 403 },
        ),
      };
    }
  }
  return {
    ok: true,
    session,
    response: NextResponse.json({ ok: true }),
  };
}

/**
 * Variante simple sync qui renvoie une `NextResponse` 401 ou `null` si OK.
 * Pratique pour les routes simples qui ne veulent pas destructurer.
 *
 * Usage :
 * ```ts
 * const unauth = requireAdminApiSimple();
 * if (unauth) return unauth;
 * ```
 */
export function requireAdminApiSimple(): NextResponse | null {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }
  return null;
}
