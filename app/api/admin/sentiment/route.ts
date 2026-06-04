/**
 * GET /api/admin/sentiment → agrégation sentiment sur NPS / chat / comments
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listSurveys } from "@/lib/nps-store";
import { listConversations } from "@/lib/chat-store";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  analyzeSentiment,
  type SentimentLabel,
} from "@/lib/sentiment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");

type SentimentSnapshot = {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  averageScore: number;
};

type NegativeExample = {
  source: "nps" | "chat" | "comment";
  text: string;
  reference?: string;
  at: string;
  score: number;
};

async function readComments(): Promise<
  {
    leadReference: string;
    body: string;
    createdAt: string;
    deletedAt?: string;
  }[]
> {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, "comments.json"),
      "utf8",
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function emptySnapshot(): SentimentSnapshot {
  return {
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
    averageScore: 0,
  };
}

function pushSnapshot(snap: SentimentSnapshot, label: SentimentLabel, score: number) {
  snap[label] += 1;
  snap.total += 1;
  snap.averageScore =
    (snap.averageScore * (snap.total - 1) + score) / snap.total;
}

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const [surveys, conversations, comments] = await Promise.all([
    listSurveys(),
    listConversations(),
    readComments(),
  ]);

  const nps = emptySnapshot();
  const chat = emptySnapshot();
  const comm = emptySnapshot();
  const flagged: NegativeExample[] = [];

  for (const s of surveys) {
    if (!s.comment) continue;
    const a = analyzeSentiment(s.comment);
    pushSnapshot(nps, a.label, a.score);
    if (a.label === "negative") {
      flagged.push({
        source: "nps",
        text: s.comment,
        reference: s.leadReference,
        at: s.respondedAt ?? s.sentAt,
        score: a.score,
      });
    }
  }

  for (const c of conversations) {
    for (const m of c.messages) {
      if (m.sender !== "visitor") continue;
      const a = analyzeSentiment(m.text);
      if (a.matches.length === 0) continue;
      pushSnapshot(chat, a.label, a.score);
      if (a.label === "negative") {
        flagged.push({
          source: "chat",
          text: m.text,
          reference: c.id,
          at: m.at,
          score: a.score,
        });
      }
    }
  }

  for (const c of comments) {
    if (c.deletedAt) continue;
    const a = analyzeSentiment(c.body);
    if (a.matches.length === 0) continue;
    pushSnapshot(comm, a.label, a.score);
    if (a.label === "negative") {
      flagged.push({
        source: "comment",
        text: c.body,
        reference: c.leadReference,
        at: c.createdAt,
        score: a.score,
      });
    }
  }

  flagged.sort((a, b) => a.score - b.score);

  return NextResponse.json({
    snapshots: { nps, chat, comments: comm },
    flagged: flagged.slice(0, 30),
  });
}
