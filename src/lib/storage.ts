import type { Conversation } from "./types";

export const STORAGE_KEY = "aurora.conversations.v1";
export const PREFS_KEY = "aurora.prefs.v1";
export const MODEL_KEY = "aurora.model.v1";
export const THEME_KEY = "aurora.theme";
export const UI_KEY = "aurora.ui.v1";

export interface SaveResult {
  ok: boolean;
  conversations: Conversation[];
  droppedConversations: number;
  droppedPayloads: number;
  bytes: number;
  error?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeConversation(value: unknown): Conversation | null {
  if (!isObject(value) || typeof value.id !== "string" || !Array.isArray(value.messages)) {
    return null;
  }
  const now = Date.now();
  const messages = value.messages
    .filter((m) => isObject(m) && typeof m.id === "string" && typeof m.content === "string")
    .map((m) => ({
      id: String(m.id),
      role: m.role === "user" ? "user" : m.role === "system" ? "system" : "assistant",
      content: String(m.content ?? ""),
      reasoning: typeof m.reasoning === "string" ? m.reasoning : undefined,
      createdAt: typeof m.createdAt === "number" ? m.createdAt : now,
      model: typeof m.model === "string" ? m.model : undefined,
      attachments: Array.isArray(m.attachments) ? (m.attachments as Conversation["messages"][number]["attachments"]) : undefined,
      status: m.status === "streaming" ? "stopped" : (m.status as Conversation["messages"][number]["status"]),
      error: typeof m.error === "string" ? m.error : undefined,
      durationMs: typeof m.durationMs === "number" ? m.durationMs : undefined,
      usage: isObject(m.usage) ? (m.usage as Conversation["messages"][number]["usage"]) : undefined,
    })) as Conversation["messages"];

  return {
    id: value.id,
    title: typeof value.title === "string" && value.title.trim() ? value.title : "New conversation",
    createdAt: typeof value.createdAt === "number" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : now,
    model: typeof value.model === "string" ? value.model : "deepseek-v4.1-flash:free",
    messages,
    pinned: Boolean(value.pinned),
  };
}

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list = parsed
      .map(normalizeConversation)
      .filter((c): c is Conversation => Boolean(c));
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function estimateConversationBytes(list: Conversation[]): number {
  try {
    return new Blob([JSON.stringify(list)]).size;
  } catch {
    return JSON.stringify(list).length;
  }
}

function oldestRemovableIndex(list: Conversation[], preserveId?: string | null): number {
  let candidate = -1;
  let oldest = Infinity;
  list.forEach((c, index) => {
    if (c.pinned || c.id === preserveId) return;
    if (c.updatedAt < oldest) {
      oldest = c.updatedAt;
      candidate = index;
    }
  });
  return candidate;
}

function stripOnePayload(list: Conversation[]): boolean {
  const ordered = list
    .map((c, index) => ({ c, index }))
    .sort((a, b) => a.c.updatedAt - b.c.updatedAt);
  for (const { c } of ordered) {
    for (const message of c.messages) {
      for (const attachment of message.attachments ?? []) {
        if (attachment.content) {
          attachment.content = undefined;
          attachment.truncated = true;
          return true;
        }
      }
    }
  }
  return false;
}

export function persistConversations(
  input: Conversation[],
  preserveId?: string | null,
): SaveResult {
  const result: SaveResult = {
    ok: true,
    conversations: input,
    droppedConversations: 0,
    droppedPayloads: 0,
    bytes: 0,
  };
  if (typeof window === "undefined") return result;

  const list = input.slice();
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const json = JSON.stringify(list);
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
      result.conversations = list;
      result.bytes = json.length;
      return result;
    } catch (error) {
      const idx = oldestRemovableIndex(list, preserveId);
      if (idx !== -1) {
        list.splice(idx, 1);
        result.droppedConversations += 1;
        continue;
      }
      if (stripOnePayload(list)) {
        result.droppedPayloads += 1;
        continue;
      }
      result.ok = false;
      result.conversations = list;
      result.error =
        error instanceof Error ? error.message : "Browser storage is full.";
      return result;
    }
  }
  result.ok = false;
  result.conversations = list;
  result.error = "Could not persist conversations.";
  return result;
}

export function removeConversationStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* preferences are best-effort */
  }
}

export function readString(key: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
