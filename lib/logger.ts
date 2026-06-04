/**
 * Logger structuré — sortie console en JSON + adapter Sentry optionnel.
 *
 * Activation Sentry :
 *   SENTRY_DSN=https://...@oXXX.ingest.sentry.io/XXX
 *
 * Sans DSN, les events warn/error sont uniquement loggés en console (toujours JSON).
 * Aucune dépendance npm requise — appel HTTP direct à Sentry "store" endpoint.
 */

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

function nowIso() {
  return new Date().toISOString();
}

function emit(level: Level, message: string, fields: Fields = {}, error?: unknown) {
  const record = {
    t: nowIso(),
    level,
    msg: message,
    ...fields,
    ...(error
      ? {
          error: {
            name: (error as Error).name,
            message: (error as Error).message,
            stack: (error as Error).stack,
          },
        }
      : {}),
  };
  const text = JSON.stringify(record);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(text);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(text);
  } else {
    // eslint-disable-next-line no-console
    console.log(text);
  }
  if ((level === "error" || level === "warn") && process.env.SENTRY_DSN) {
    void sendToSentry(level, message, fields, error);
  }
}

/* ───────────────────── Sentry adapter (fetch direct) ───────────────────── */

function parseDsn(dsn: string) {
  // Format : https://<publicKey>@<host>/<projectId>
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, "");
    const host = url.host;
    return { publicKey, projectId, host };
  } catch {
    return null;
  }
}

async function sendToSentry(
  level: Level,
  message: string,
  fields: Fields,
  error?: unknown,
) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const parts = parseDsn(dsn);
  if (!parts) return;
  const eventId = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  const payload: Record<string, unknown> = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level,
    server_name: "chauffage-artisanal",
    environment: process.env.NODE_ENV ?? "development",
    message,
    extra: fields,
  };
  if (error instanceof Error) {
    payload.exception = {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: { frames: [] },
        },
      ],
    };
  }
  try {
    await fetch(
      `https://${parts.host}/api/${parts.projectId}/store/?sentry_key=${parts.publicKey}&sentry_version=7`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  } catch {
    // Échec silencieux — on n'arrête pas le service pour un log
  }
}

/* ───────────────────── Public API ───────────────────── */

export const logger = {
  debug: (msg: string, fields?: Fields) => emit("debug", msg, fields),
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields, error?: unknown) => emit("warn", msg, fields, error),
  error: (msg: string, error?: unknown, fields?: Fields) => emit("error", msg, fields, error),
};

/** Helper pour wrapper une fonction async et logger les erreurs. */
export async function tryLog<T>(
  scope: string,
  fn: () => Promise<T>,
  fields: Fields = {},
): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    logger.error(`[${scope}] failed`, e, fields);
    return null;
  }
}
