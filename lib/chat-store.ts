/**
 * Live chat — conversations persistées en JSON.
 *
 * Architecture polling :
 *   - Le visiteur ouvre le widget → on crée/récupère une conversation par
 *     visitorId (cookie ca-visitor) ou par sessionId généré.
 *   - Messages stockés avec sender (visitor/agent), text, timestamp.
 *   - Le client poll /api/chat/[id]/messages?since=<timestamp> toutes les 5s.
 *   - L'admin poll /api/admin/chat/conversations toutes les 10s.
 *
 * Pas de WebSocket — on est best-effort sur serverless.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const CHAT_FILE = path.join(DATA_DIR, "chat-conversations.json");

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: "visitor" | "agent";
  agentEmail?: string;
  text: string;
  at: string; // ISO
  readByAgent?: boolean;
  readByVisitor?: boolean;
};

export type Conversation = {
  id: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPath?: string; // page d'ouverture
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  unreadAgent: number;
  unreadVisitor: number;
  messages: ChatMessage[];
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Conversation[]> {
  try {
    return JSON.parse(await fs.readFile(CHAT_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(c: Conversation[]) {
  await ensureDir();
  await fs.writeFile(CHAT_FILE, JSON.stringify(c, null, 2), "utf8");
}

export async function listConversations(): Promise<Conversation[]> {
  return (await readAll()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  return (await readAll()).find((c) => c.id === id);
}

export async function createConversation(opts: {
  visitorName?: string;
  visitorEmail?: string;
  visitorPath?: string;
}): Promise<Conversation> {
  const all = await readAll();
  const c: Conversation = {
    id: `conv-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`,
    visitorName: opts.visitorName,
    visitorEmail: opts.visitorEmail,
    visitorPath: opts.visitorPath,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadAgent: 0,
    unreadVisitor: 0,
    messages: [],
  };
  all.push(c);
  await writeAll(all);
  return c;
}

export async function addMessage(
  conversationId: string,
  msg: Omit<ChatMessage, "id" | "conversationId" | "at">,
): Promise<ChatMessage | null> {
  const all = await readAll();
  const c = all.find((x) => x.id === conversationId);
  if (!c) return null;
  const m: ChatMessage = {
    ...msg,
    id: `msg-${Date.now().toString(36)}-${randomBytes(2).toString("hex")}`,
    conversationId,
    at: new Date().toISOString(),
  };
  c.messages.push(m);
  c.updatedAt = m.at;
  if (msg.sender === "visitor") c.unreadAgent++;
  else c.unreadVisitor++;
  await writeAll(all);
  return m;
}

export async function markRead(
  conversationId: string,
  who: "visitor" | "agent",
): Promise<void> {
  const all = await readAll();
  const c = all.find((x) => x.id === conversationId);
  if (!c) return;
  if (who === "agent") {
    c.unreadAgent = 0;
    c.messages.forEach((m) => {
      if (m.sender === "visitor") m.readByAgent = true;
    });
  } else {
    c.unreadVisitor = 0;
    c.messages.forEach((m) => {
      if (m.sender === "agent") m.readByVisitor = true;
    });
  }
  await writeAll(all);
}

export async function closeConversation(conversationId: string): Promise<boolean> {
  const all = await readAll();
  const c = all.find((x) => x.id === conversationId);
  if (!c) return false;
  c.status = "closed";
  c.updatedAt = new Date().toISOString();
  await writeAll(all);
  return true;
}

export async function getMessagesSince(
  conversationId: string,
  sinceIso: string,
): Promise<ChatMessage[]> {
  const c = await getConversation(conversationId);
  if (!c) return [];
  const sinceMs = new Date(sinceIso).getTime();
  return c.messages.filter((m) => new Date(m.at).getTime() > sinceMs);
}
