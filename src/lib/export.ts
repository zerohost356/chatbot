import type { Conversation, Message } from "./types";
import { formatDate, formatBytes, slugify } from "./utils";

function attachmentMarkdown(attachment: NonNullable<Message["attachments"]>[number]): string {
  const bits = [`${attachment.kind === "image" ? "Image" : "File"}: ${attachment.name}`, formatBytes(attachment.size)];
  if (attachment.truncated) bits.push("truncated");
  return `- ${bits.join(" · ")}`;
}

export function messageToMarkdown(message: Message): string {
  const who = message.role === "user" ? "You" : message.role === "assistant" ? "Aurora" : "System";
  const lines: string[] = [`### ${who}`, ""];
  if (message.reasoning?.trim()) {
    lines.push("<details>", "<summary>Reasoning trace</summary>", "", message.reasoning.trim(), "", "</details>", "");
  }
  lines.push(message.content.trim() || "_Empty message_", "");
  if (message.attachments?.length) {
    lines.push("**Attachments**", ...message.attachments.map(attachmentMarkdown), "");
  }
  return lines.join("\n");
}

export function conversationToMarkdown(conversation: Conversation): string {
  const header = [
    `# ${conversation.title}`,
    "",
    `> Exported from Aurora on ${formatDate(Date.now())}`,
    `>`,
    `> ${conversation.messages.length} messages · model \`${conversation.model}\``,
    "",
    "---",
    "",
  ];
  const body = conversation.messages.map(messageToMarkdown).join("\n---\n\n");
  return `${header.join("\n")}${body}\n`.replace(/\n{4,}/g, "\n\n\n");
}

export function conversationToJSON(conversation: Conversation): string {
  return JSON.stringify(
    {
      schema: "aurora.conversation/1",
      exportedAt: new Date().toISOString(),
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: new Date(conversation.createdAt).toISOString(),
        updatedAt: new Date(conversation.updatedAt).toISOString(),
        model: conversation.model,
        pinned: Boolean(conversation.pinned),
        messages: conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          reasoning: message.reasoning ?? null,
          createdAt: new Date(message.createdAt).toISOString(),
          model: message.model ?? null,
          status: message.status ?? "done",
          durationMs: message.durationMs ?? null,
          usage: message.usage ?? null,
          attachments: (message.attachments ?? []).map((attachment) => ({
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
            kind: attachment.kind,
            truncated: Boolean(attachment.truncated),
            content: attachment.kind === "text" ? attachment.content ?? null : null,
          })),
        })),
      },
    },
    null,
    2,
  );
}

export function downloadText(filename: string, content: string, mime: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function conversationBaseName(conversation: Conversation): string {
  const date = new Date(conversation.createdAt);
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  return `${slugify(conversation.title)}-${stamp}`;
}

export function downloadConversationMarkdown(conversation: Conversation): void {
  downloadText(
    `${conversationBaseName(conversation)}.md`,
    conversationToMarkdown(conversation),
    "text/markdown",
  );
}

export function downloadConversationJSON(conversation: Conversation): void {
  downloadText(
    `${conversationBaseName(conversation)}.json`,
    conversationToJSON(conversation),
    "application/json",
  );
}
