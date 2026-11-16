export type Align = "left" | "center" | "right" | null;

export interface ListItem {
  checked: boolean | null;
  blocks: Block[];
}

export type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string | null; code: string; closed: boolean }
  | { type: "blockquote"; children: Block[] }
  | { type: "list"; ordered: boolean; start: number; items: ListItem[]; tight: boolean }
  | { type: "table"; align: Align[]; header: string[]; rows: string[][] }
  | { type: "hr" };

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)?.*$/;
const HEADING_RE = /^ {0,3}(#{1,6})(?:[ \t]+|$)(.*)$/;
const HR_RE = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const QUOTE_RE = /^ {0,3}>[ \t]?(.*)$/;
const LIST_RE = /^(\s*)([-+*]|\d{1,9}[.)])([ \t]+)(.*)$/;
const SETEXT_RE = /^ {0,3}(=+|-+)[ \t]*$/;

function countIndent(line: string): number {
  let n = 0;
  for (const char of line) {
    if (char === " ") n += 1;
    else if (char === "\t") n += 4;
    else break;
  }
  return n;
}

function splitRow(line: string): string[] {
  let value = line.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1);
  const cells: string[] = [];
  let current = "";
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "\\" && value[i + 1] === "|") {
      current += "|";
      i += 1;
      continue;
    }
    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function isTableSeparator(line: string): boolean {
  const cells = splitRow(line);
  if (!cells.length) return false;
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s+/g, "")));
}

function alignments(separator: string): Align[] {
  return splitRow(separator).map((cell) => {
    const trimmed = cell.trim();
    const left = trimmed.startsWith(":");
    const right = trimmed.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
  });
}

function isBlockStart(line: string, next?: string): boolean {
  if (!line.trim()) return true;
  if (FENCE_RE.test(line)) return true;
  if (HEADING_RE.test(line)) return true;
  if (HR_RE.test(line)) return true;
  if (QUOTE_RE.test(line)) return true;
  if (LIST_RE.test(line)) return true;
  if (line.includes("|") && next && isTableSeparator(next)) return true;
  return false;
}

interface ParsedList {
  block: Block;
  next: number;
}

function parseList(lines: string[], start: number): ParsedList | null {
  const first = LIST_RE.exec(lines[start]);
  if (!first) return null;
  const baseIndent = countIndent(first[1]);
  const ordered = /\d/.test(first[2]);
  const startNumber = ordered ? Number.parseInt(first[2], 10) || 1 : 1;
  const items: ListItem[] = [];
  let tight = true;
  let i = start;

  while (i < lines.length) {
    const match = LIST_RE.exec(lines[i]);
    if (!match) break;
    const indent = countIndent(match[1]);
    const itemOrdered = /\d/.test(match[2]);
    if (indent !== baseIndent || itemOrdered !== ordered) break;

    const raw: string[] = [match[4]];
    i += 1;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        const nextLine = lines[i + 1];
        const nextMatch = nextLine ? LIST_RE.exec(nextLine) : null;
        const nextIndent = nextLine ? countIndent(nextLine) : 0;
        if (nextLine && (nextIndent > baseIndent || (nextMatch && countIndent(nextMatch[1]) === baseIndent))) {
          raw.push("");
          tight = false;
          i += 1;
          continue;
        }
        break;
      }
      const nextMatch = LIST_RE.exec(line);
      if (nextMatch) {
        const nextIndent = countIndent(nextMatch[1]);
        if (nextIndent < baseIndent) break;
        if (nextIndent === baseIndent) break;
      }
      const indentSize = countIndent(line);
      if (indentSize > baseIndent) {
        raw.push(line.replace(new RegExp(`^[ \\t]{0,${baseIndent + 3}}`), ""));
        i += 1;
        continue;
      }
      // Lazy paragraph continuation.
      raw.push(line);
      i += 1;
    }

    let checked: boolean | null = null;
    const task = /^\[([ xX])\](?:[ \t]+|$)(.*)$/.exec(raw[0] ?? "");
    if (task) {
      checked = task[1].toLowerCase() === "x";
      raw[0] = task[2];
    }
    items.push({ checked, blocks: parseBlocks(raw) });
  }

  return {
    block: { type: "list", ordered, start: startNumber, items, tight },
    next: i,
  };
}

export function parseBlocks(input: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < input.length) {
    const line = input[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const marker = fence[1];
      const lang = (fence[2] || "").trim().replace(/^\{?\.?|\}?$/g, "") || null;
      const code: string[] = [];
      i += 1;
      let closed = false;
      while (i < input.length) {
        const closing = new RegExp(`^ {0,3}${marker[0] === "`" ? "`" : "~"}{${marker.length},}\\s*$`);
        if (closing.test(input[i])) {
          closed = true;
          i += 1;
          break;
        }
        code.push(input[i]);
        i += 1;
      }
      blocks.push({ type: "code", lang, code: code.join("\n"), closed });
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (HR_RE.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const quoteLines: string[] = [];
      while (i < input.length) {
        const q = QUOTE_RE.exec(input[i]);
        if (q) {
          quoteLines.push(q[1]);
          i += 1;
          continue;
        }
        if (!input[i].trim() && i + 1 < input.length && QUOTE_RE.test(input[i + 1])) {
          quoteLines.push("");
          i += 1;
          continue;
        }
        break;
      }
      blocks.push({ type: "blockquote", children: parseBlocks(quoteLines) });
      continue;
    }

    if (line.includes("|") && i + 1 < input.length && isTableSeparator(input[i + 1])) {
      const header = splitRow(line);
      const align = alignments(input[i + 1]);
      const rows: string[][] = [];
      i += 2;
      while (i < input.length && input[i].includes("|") && input[i].trim()) {
        rows.push(splitRow(input[i]));
        i += 1;
      }
      blocks.push({ type: "table", align, header, rows });
      continue;
    }

    if (LIST_RE.test(line)) {
      const parsed = parseList(input, i);
      if (parsed) {
        blocks.push(parsed.block);
        i = parsed.next;
        continue;
      }
    }

    if (SETEXT_RE.test(input[i + 1] ?? "") && line.trim()) {
      const underline = SETEXT_RE.exec(input[i + 1])!;
      blocks.push({
        type: "heading",
        level: underline[1].startsWith("=") ? 1 : 2,
        text: line.trim(),
      });
      i += 2;
      continue;
    }

    if (/^ {4}/.test(line)) {
      const code: string[] = [];
      while (i < input.length && (/^ {4}/.test(input[i]) || !input[i].trim())) {
        code.push(input[i].replace(/^ {4}/, ""));
        i += 1;
      }
      blocks.push({ type: "code", lang: null, code: code.join("\n").replace(/\n+$/, ""), closed: true });
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (i < input.length) {
      const next = input[i];
      if (!next.trim()) break;
      if (SETEXT_RE.test(input[i + 1] ?? "") && next.trim()) break;
      if (isBlockStart(next, input[i + 1])) break;
      paragraph.push(next);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join("\n").trimEnd() });
  }

  return blocks;
}

export function parseMarkdown(source: string): Block[] {
  const normalized = source
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .replace(/\u00a0/g, " ");
  return parseBlocks(normalized.split("\n"));
}
