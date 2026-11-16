export interface DemoReply {
  reasoning: string;
  content: string;
}

const DEFAULT_REPLY = `# Welcome to Aurora

You are inside a **streaming, full-stack chat workspace** built with Next.js. Responses render token by token, Markdown is parsed into clean reading blocks, and code is highlighted locally.

## What is live right now

| Layer | What you get | State |
| --- | --- | --- |
| Transport | NDJSON token stream with abort support | Live |
| Rendering | Headings, tables, tasks, quotes, links | Live |
| Code | Language label, line count, copy button | Live |
| Workspace | Threads, search, rename, stable \`/c/:id\` links | Live |
| Export | Markdown, JSON, per-message copy | Live |

## A tiny release checklist

- [x] Stream reasoning before the answer
- [x] Collapse the reasoning trace automatically
- [x] Preserve partial output when a stream is stopped
- [ ] Ask me to build something real
- [ ] Export this thread from the info panel

## Why the layout feels calm

1. **Three panes, one focus.** History on the left, reading in the middle, metadata on the right.
2. **Generous rhythm.** Long-form answers stay under a comfortable measure.
3. **Motion with restraint.** Messages fade in, panels slide, and nothing blocks the text.

> The best interface is the one you stop noticing. Aurora keeps controls close, then gets out of the way.

\`\`\`typescript
type StreamEvent =
  | { type: "reasoning"; delta: string }
  | { type: "content"; delta: string }
  | { type: "done"; usage: { totalTokens: number } };

export function reduce(event: StreamEvent) {
  if (event.type === "content") return { append: event.delta };
  return { append: "" };
}
\`\`\`

Try **“highlight every language”**, **“show the markdown playground”**, or attach a file to see the composer in action. You can also read the [Terms](/terms) and [Privacy](/privacy) pages.`;

const MARKDOWN_REPLY = `# Markdown playground

Everything below is parsed by a custom renderer — no HTML injection, no layout surprises.

## Text, marks, and links

This is **bold**, this is _italic_, this is ~~struck through~~, this is ==highlighted==, and this is \`inline code\`.

Inline links stay safe: [Next.js documentation](https://nextjs.org/docs), [LiteRouter](https://literouter.com), and an autolink <https://nextjs.org>. A bare URL also works: https://example.com/path?q=aurora.

Hard breaks are respected.  
This line begins after a hard break.

## The tables you asked for

| Feature | Desktop | Mobile |
| :--- | :---: | ---: |
| Sidebar | Docked | Swipe drawer |
| Info panel | Docked | Slide-over |
| Composer | Sticky footer | Safe-area aware |
| Code blocks | Numbered lines | Horizontal scroll |

## Task lists

- [x] Parse GFM tables with alignment
- [x] Render nested task lists
- [x] Keep code fences safe while streaming
- [ ] Add footnotes
- [ ] Add math rendering

## Nested lists

1. Transport
   - NDJSON frames
   - Abort controller
   - Retry with the same context
2. Presentation
   - Markdown blocks
   - Highlighted tokens
   - Streaming caret

## Quotes

> A quote can contain **formatting**, \`code\`, and even a list:
>
> - one
> - two

---

That rule above is a horizontal rule. The renderer also handles images, headings, setext headings, and indented code. Streaming works while blocks are still incomplete: an open fence becomes a code block, and a partial table waits for its separator row.`;

const CODE_REPLY = `# Syntax highlighting, every language

The highlighter is local, dependency-free, and fast enough to run while tokens stream. Each block gets a language label, a line count, and a copy button.

## TypeScript

\`\`\`typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

export function append(stream: string[], delta: string): string[] {
  if (!delta) return stream;
  return [...stream, delta].slice(-600);
}
\`\`\`

## JSON

\`\`\`json
{
  "schema": "aurora.conversation/1",
  "model": "deepseek-v4.1-flash:free",
  "streaming": true,
  "usage": { "prompt_tokens": 128, "completion_tokens": 420 }
}
\`\`\`

## Bash

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail

export APP_ENV="production"
npm run build
npm run start
curl -fsS http://localhost:5000/api/models | head -c 240
\`\`\`

## Python

\`\`\`python
from dataclasses import dataclass

@dataclass
class Event:
    kind: str
    delta: str = ""

def collapse(events: list[Event]) -> str:
    return "".join(e.delta for e in events if e.kind == "content")
\`\`\`

## SQL

\`\`\`sql
SELECT c.id, c.title, COUNT(m.id) AS messages
FROM conversations AS c
LEFT JOIN messages AS m ON m.conversation_id = c.id
WHERE c.updated_at > now() - interval '7 days'
GROUP BY c.id, c.title
ORDER BY messages DESC
LIMIT 20;
\`\`\`

## HTML

\`\`\`html
<section class="message" data-role="assistant">
  <header class="message-head">
    <span class="author">Aurora</span>
    <button type="button" aria-label="Copy">Copy</button>
  </header>
  <div class="markdown">...</div>
</section>
\`\`\`

## CSS

\`\`\`css
.code-block {
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.code-line:hover { background: rgb(255 255 255 / 0.04); }
@media (max-width: 700px) { .code-ln { display: none; } }
\`\`\`

## YAML

\`\`\`yaml
name: aurora
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      LITEROUTER_MODEL: deepseek-v4.1-flash:free
      NODE_ENV: production
\`\`\`

Every sample above is highlighted locally. Copy any block with the button in its header.`;

const ATTACH_REPLY = `# Attachments and long input

The composer accepts drag-and-drop, pasted files, and a file picker. Text is read locally and injected into context only when you send.

## Current limits

| Input | Limit | What happens |
| --- | --- | --- |
| Files per message | 8 | Extra files are rejected with a toast |
| Single file | 10 MB | Checked before reading |
| Total per message | 25 MB | Protects browser memory |
| Text excerpt | 40,000 chars | Marked as truncated |
| Images | 4 | Downscaled before storage |
| Pasted text | 6,000 chars | Becomes a text attachment |
| Message length | 32,000 chars | Counter warns before send |

## What is supported

- [x] Drag files anywhere over the composer
- [x] Paste screenshots or text files
- [x] Text, code, JSON, CSV, Markdown, and logs
- [x] Image previews for vision models
- [x] Remove a single attachment before sending
- [ ] OCR for scanned PDFs
- [ ] Server-side file storage

> Binary files keep their name and size, but their bytes are not uploaded. Text attachments stay in local storage and are trimmed first if quota runs low.

Ask me to compare two files, summarize a log, or turn a pasted document into a checklist.`;

const EXPORT_REPLY = `# Export anything

Conversations never leave this browser unless you send them to a model. Export gives you a portable copy whenever you want one.

## Three export paths

1. **Copy message** — Markdown source for one message.
2. **Copy thread** — The whole conversation as Markdown.
3. **Download** — Markdown or structured JSON.

\`\`\`typescript
export function toJSON(conversation: Conversation) {
  return JSON.stringify({
    schema: "aurora.conversation/1",
    exportedAt: new Date().toISOString(),
    conversation,
  }, null, 2);
}
\`\`\`

## JSON shape

| Field | Type | Notes |
| --- | --- | --- |
| \`schema\` | string | Versioned envelope |
| \`exportedAt\` | ISO date | Export timestamp |
| \`conversation.messages\` | array | Content, reasoning, usage |
| \`attachments\` | array | Metadata plus text excerpts |

The info panel shows message counts, word counts, estimated tokens, attachment size, and local storage usage before you download.`;

const STREAM_REPLY = `# Streaming and reasoning

Aurora reads newline-delimited JSON from \`/api/chat\`. Reasoning and answer tokens travel on separate channels, so the UI can show a thinking trace without mixing it into the final answer.

## Event flow

\`\`\`typescript
for await (const frame of stream) {
  if (frame.type === "reasoning") {
    setReasoning((prev) => prev + frame.delta);
  }
  if (frame.type === "content") {
    setContent((prev) => prev + frame.delta);
  }
  if (frame.type === "done") {
    setStatus("done");
    setUsage(frame.usage);
  }
}
\`\`\`

## Stop and retry

- The send button becomes **Stop** while a stream is open.
- Aborting preserves the partial answer and labels it **stopped**.
- **Retry** drops the failed answer and replays the last user turn.
- **Regenerate** asks for a fresh answer without editing history.

## Context budget

| Window | Value |
| --- | --- |
| Message cap | 32,000 characters |
| Context cap | 96,000 characters |
| Recent turns kept | 24 |
| Older content | Trimmed with a visible marker |

> Long threads are clipped from the oldest side first. The info panel shows how much of the context budget the thread is using.

## Provider fallback

When no API key is present, the server streams a local demo reply. With a key, it proxies LiteRouter's OpenAI-compatible endpoint and forwards \`reasoning_content\` when the model exposes it.`;

function sanitizeEcho(prompt: string): string {
  return prompt
    .replace(/\s+/g, " ")
    .replace(/([\\`*_{}[\]()#+.!>~|])/g, "\\$1")
    .trim()
    .slice(0, 180);
}

export function pickDemoReply(prompt: string, hasAttachments = false): DemoReply {
  const text = prompt.toLowerCase();
  const attachmentNote = hasAttachments
    ? " The message includes attachments, so I should acknowledge those first."
    : " There are no attachments in this turn.";

  let content = DEFAULT_REPLY;
  let focus = "the workspace overview";

  if (/all language|every language|syntax|highlight|code sample|code block/.test(text)) {
    content = CODE_REPLY;
    focus = "the syntax-highlighting catalogue";
  } else if (/markdown|playground|render|formatting|table|task list/.test(text)) {
    content = MARKDOWN_REPLY;
    focus = "Markdown block coverage";
  } else if (/attach|upload|file|image|paste|drag/.test(text)) {
    content = ATTACH_REPLY;
    focus = "attachments and long input";
  } else if (/export|download|json|markdown file|backup/.test(text)) {
    content = EXPORT_REPLY;
    focus = "conversation export";
  } else if (/stream|reason|thinking|retry|stop|context/.test(text)) {
    content = STREAM_REPLY;
    focus = "streaming internals";
  }

  const asked = sanitizeEcho(prompt) || "an empty prompt";
  const reasoning = `The user asked about ${focus} with: "${asked}".${attachmentNote} I will answer with a compact overview, then use a table, a checklist, and a code sample where each one makes the answer easier to scan. I should keep the prose short and let the formatting carry the structure.`;

  return { reasoning, content };
}
