import type { Conversation, Message, ModelInfo } from "./types";
import { clamp, countWords, estimateTokens, truncate, uid } from "./utils";

export const MAX_MESSAGE_CHARS = 32_000;
export const MAX_CONTEXT_CHARS = 96_000;
export const MAX_CONTEXT_MESSAGES = 24;

export const MODEL_OPTIONS: ModelInfo[] = [
  {
    id: "deepseek-v4.1-flash:free",
    name: "DeepSeek V4.1 Flash",
    vendor: "DeepSeek · Free",
    description: "Fast reasoning model with a generous free tier.",
    context: 1_048_576,
    reasoning: true,
    vision: true,
    free: true,
    recommended: true,
    available: true,
  },
  {
    id: "deepseek-v4.1-flash-1017:free",
    name: "DeepSeek V4.1 Flash 1017",
    vendor: "DeepSeek · Free",
    description: "Pinned build of DeepSeek V4.1 Flash.",
    context: 1_048_576,
    reasoning: true,
    vision: true,
    free: true,
    recommended: false,
    available: true,
  },
  {
    id: "deepseek-v4.1-flash-cheap:free",
    name: "DeepSeek V4.1 Flash Cheap",
    vendor: "DeepSeek · Free",
    description: "Lightweight variant for everyday tasks.",
    context: 1_048_576,
    reasoning: true,
    vision: false,
    free: true,
    recommended: false,
    available: true,
  },
  {
    id: "deepseek-v4-flash:free",
    name: "DeepSeek V4 Flash",
    vendor: "DeepSeek · Free",
    description: "The previous generation fast model.",
    context: 1_048_576,
    reasoning: true,
    vision: true,
    free: true,
    recommended: false,
    available: true,
  },
];

export const FALLBACK_MODEL: ModelInfo = MODEL_OPTIONS[0];

export function createConversation(model = FALLBACK_MODEL.id): Conversation {
  const now = Date.now();
  return {
    id: uid("c"),
    title: "New conversation",
    createdAt: now,
    updatedAt: now,
    model,
    messages: [],
  };
}

export function createMessage(role: Message["role"], content = ""): Message {
  return {
    id: uid("m"),
    role,
    content,
    createdAt: Date.now(),
    status: role === "assistant" ? "streaming" : "done",
  };
}

const TITLE_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "can", "could", "would", "should",
  "please", "help", "me", "my", "i", "you", "we", "it", "this", "that", "how",
  "what", "why", "when", "where", "which", "do", "does", "did",
]);

export function deriveTitle(text: string): string {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()|-]+/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "New conversation";
  const words = cleaned.split(" ").filter(Boolean);
  const meaningful = words.filter((w) => !TITLE_STOPWORDS.has(w.toLowerCase()));
  const source = meaningful.length >= 3 ? meaningful : words;
  const title = truncate(source.slice(0, 8).join(" "), 52);
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function conversationTitleIsAuto(title: string): boolean {
  return title === "New conversation" || title.startsWith("New conversation");
}

export function messageTextForContext(message: Message): string {
  const parts: string[] = [];
  if (message.content) parts.push(message.content);
  for (const attachment of message.attachments ?? []) {
    if (!attachment.content) continue;
    if (attachment.kind === "text") {
      parts.push(
        `\n\n--- Attached file: ${attachment.name} (${attachment.size} bytes) ---\n${attachment.content}`,
      );
    }
  }
  return parts.join("");
}

export function buildContext(messages: Message[], budget = MAX_CONTEXT_CHARS) {
  const usable = messages.filter((m) => m.role !== "system" && m.content.trim());
  const sliced = usable.slice(-MAX_CONTEXT_MESSAGES);
  const result: { role: "user" | "assistant"; content: string; attachments?: Message["attachments"] }[] = [];
  let used = 0;
  for (let i = sliced.length - 1; i >= 0; i -= 1) {
    const message = sliced[i];
    const text = messageTextForContext(message);
    if (!text) continue;
    const remaining = budget - used;
    if (remaining <= 80) break;
    const clipped = text.length > remaining ? `${text.slice(0, remaining)}\n\n[…trimmed for context…]` : text;
    result.unshift({
      role: message.role === "assistant" ? "assistant" : "user",
      content: clipped,
      attachments:
        message.role === "user"
          ? (message.attachments ?? []).filter((a) => a.kind === "image" && a.content)
          : undefined,
    });
    used += clipped.length;
  }
  return { messages: result, used, budget, trimmed: usable.length > sliced.length };
}

export interface ConversationStats {
  messages: number;
  userMessages: number;
  assistantMessages: number;
  words: number;
  characters: number;
  attachments: number;
  attachmentBytes: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  lastUpdated: number;
}

export function getConversationStats(conversation: Conversation | null): ConversationStats {
  const stats: ConversationStats = {
    messages: 0,
    userMessages: 0,
    assistantMessages: 0,
    words: 0,
    characters: 0,
    attachments: 0,
    attachmentBytes: 0,
    tokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    lastUpdated: conversation?.updatedAt ?? 0,
  };
  if (!conversation) return stats;
  for (const message of conversation.messages) {
    if (message.role === "user") stats.userMessages += 1;
    if (message.role === "assistant") stats.assistantMessages += 1;
    stats.messages += 1;
    stats.words += countWords(message.content);
    stats.characters += message.content.length + (message.reasoning?.length ?? 0);
    stats.tokens += estimateTokens(message.content) + estimateTokens(message.reasoning ?? "");
    stats.promptTokens += message.usage?.promptTokens ?? 0;
    stats.completionTokens += message.usage?.completionTokens ?? 0;
    for (const attachment of message.attachments ?? []) {
      stats.attachments += 1;
      stats.attachmentBytes += attachment.size;
    }
  }
  return stats;
}

export function contextPercent(used: number, budget = MAX_CONTEXT_CHARS): number {
  return clamp(Math.round((used / budget) * 100), 0, 100);
}

export function upsertMessage(conversation: Conversation, message: Message): Conversation {
  const index = conversation.messages.findIndex((m) => m.id === message.id);
  const messages = index === -1
    ? [...conversation.messages, message]
    : conversation.messages.map((m, i) => (i === index ? message : m));
  return { ...conversation, messages, updatedAt: Date.now() };
}

export function latestAssistant(messages: Message[]): Message | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "assistant") return messages[i];
  }
  return undefined;
}

export function lastUser(messages: Message[]): Message | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return messages[i];
  }
  return undefined;
}

export function friendlyModelName(id: string, models: ModelInfo[]): string {
  const model = models.find((m) => m.id === id);
  if (model) return model.name;
  if (id === FALLBACK_MODEL.id) return FALLBACK_MODEL.name;
  return id
    .replace(/:free$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
