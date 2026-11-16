import React, { type ReactNode, useState } from "react";

const BR_SENTINEL = "\uE000";

const PUNCTUATION = "\\`*_{}[]()#+-.!>~|";

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function safeUrl(raw: string, forImage = false): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (forImage && /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(url)) return url;
  if (/^(https?:|mailto:)/i.test(url)) return url;
  if (/^#|^\/(?!\/)|^\.{1,2}\//.test(url)) return url;
  return null;
}

function MarkdownImage({ src, alt, title }: { src: string; alt: string; title?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="md-image-fallback" role="img" aria-label={alt || "Image unavailable"}>
        <span>{alt ? `Image unavailable: ${alt}` : "Image unavailable."}</span>
        <a href={src} target="_blank" rel="noopener noreferrer">
          Open image
        </a>
      </span>
    );
  }

  return (
    <span className="md-image-wrap">
      {/* Arbitrary Markdown image hosts cannot use Next Image's static host allowlist. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        title={title}
        loading="lazy"
        decoding="async"
        className="md-image"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function pushText(nodes: ReactNode[], value: string, keyBase: string) {
  if (!value) return;
  nodes.push(decodeEntities(value));
}

function renderNodes(text: string, keyPrefix: string, depth: number): ReactNode[] {
  if (depth > 8) return [text];
  const nodes: ReactNode[] = [];
  const prepared = text
    .replace(/ {2,}\n/g, BR_SENTINEL)
    .replace(/\\\n/g, BR_SENTINEL)
    .replace(/\n/g, " ");

  let i = 0;
  let plain = "";
  let key = 0;

  const flush = () => {
    if (plain) {
      pushText(nodes, plain, `${keyPrefix}-${key}`);
      plain = "";
    }
  };

  const nextKey = (type: string) => `${keyPrefix}-${type}-${key++}`;

  while (i < prepared.length) {
    const char = prepared[i];

    if (char === BR_SENTINEL) {
      flush();
      nodes.push(React.createElement("br", { key: nextKey("br") }));
      i += 1;
      continue;
    }

    if (char === "\\") {
      const next = prepared[i + 1];
      if (next && (PUNCTUATION.includes(next) || next === "\\")) {
        plain += next;
        i += 2;
      } else {
        plain += "\\";
        i += 1;
      }
      continue;
    }

    if (char === "`") {
      let run = 1;
      while (prepared[i + run] === "`") run += 1;
      const close = prepared.indexOf("`".repeat(run), i + run);
      if (close !== -1) {
        flush();
        let code = prepared.slice(i + run, close);
        if (code.startsWith(" ") && code.endsWith(" ") && code.trim()) code = code.slice(1, -1);
        nodes.push(React.createElement("code", { key: nextKey("code"), className: "md-inline-code" }, code));
        i = close + run;
        continue;
      }
      plain += "`".repeat(run);
      i += run;
      continue;
    }

    if (char === "!" && prepared[i + 1] === "[") {
      const match =
        /!\[([^\]]*)\]\(\s*(?:<([^>\s]+)>|((?:\\.|[^()\s]|(?:\([^()\s]*\)))+))(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)/y;
      match.lastIndex = i;
      const found = match.exec(prepared);
      if (found) {
        flush();
        const src = safeUrl(found[2] ?? found[3], true);
        if (src) {
          nodes.push(
            React.createElement(MarkdownImage, {
              key: nextKey("img"),
              src,
              alt: decodeEntities(found[1] || ""),
              title: found[4] ?? found[5],
            }),
          );
        } else {
          nodes.push(React.createElement("span", { key: nextKey("img-alt") }, found[0]));
        }
        i = match.lastIndex;
        continue;
      }
    }

    if (char === "[") {
      const match = /\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+["']([^"']*)["'])?\s*\)/y;
      match.lastIndex = i;
      const found = match.exec(prepared);
      if (found) {
        flush();
        const href = safeUrl(found[2]);
        const inner = renderNodes(found[1], nextKey("link-inner"), depth + 1);
        const external = /^https?:/i.test(href ?? "");
        nodes.push(
          href
            ? React.createElement(
                "a",
                {
                  key: nextKey("link"),
                  href,
                  title: found[3] || undefined,
                  className: "md-link",
                  target: external ? "_blank" : undefined,
                  rel: external ? "noopener noreferrer" : undefined,
                },
                ...inner,
              )
            : React.createElement("span", { key: nextKey("link-alt") }, found[0]),
        );
        i = match.lastIndex;
        continue;
      }
    }

    if (char === "<") {
      const auto = /<((?:https?:\/\/|mailto:)[^\s<>]+)>/y;
      auto.lastIndex = i;
      const found = auto.exec(prepared);
      if (found) {
        flush();
        const href = safeUrl(found[1]);
        if (href) {
          nodes.push(
            React.createElement(
              "a",
              {
                key: nextKey("auto"),
                href,
                className: "md-link",
                target: /^https?:/i.test(href) ? "_blank" : undefined,
                rel: "noopener noreferrer",
              },
              found[1].replace(/^mailto:/i, ""),
            ),
          );
        } else {
          plain += found[0];
        }
        i = auto.lastIndex;
        continue;
      }
    }

    if (char === "*" || char === "_") {
      const strongSource = char === "*" ? /\*\*([\s\S]+?)\*\*/y : /(?<![\w])__([\s\S]+?)__(?![\w])/y;
      strongSource.lastIndex = i;
      const strong = strongSource.exec(prepared);
      if (strong) {
        flush();
        nodes.push(
          React.createElement(
            "strong",
            { key: nextKey("strong") },
            ...renderNodes(strong[1], nextKey("strong-inner"), depth + 1),
          ),
        );
        i = strongSource.lastIndex;
        continue;
      }
      const delSource = char === "*" ? /\*([^*\n]+?)\*/y : /(?<![\w])_([^_\n]+?)_(?![\w])/y;
      delSource.lastIndex = i;
      const em = delSource.exec(prepared);
      if (em) {
        flush();
        nodes.push(
          React.createElement(
            "em",
            { key: nextKey("em") },
            ...renderNodes(em[1], nextKey("em-inner"), depth + 1),
          ),
        );
        i = delSource.lastIndex;
        continue;
      }
    }

    if (char === "~" && prepared[i + 1] === "~") {
      const match = /~~([\s\S]+?)~~/y;
      match.lastIndex = i;
      const found = match.exec(prepared);
      if (found) {
        flush();
        nodes.push(
          React.createElement(
            "del",
            { key: nextKey("del") },
            ...renderNodes(found[1], nextKey("del-inner"), depth + 1),
          ),
        );
        i = match.lastIndex;
        continue;
      }
    }

    if (char === "=" && prepared[i + 1] === "=") {
      const match = /==([\s\S]+?)==/y;
      match.lastIndex = i;
      const found = match.exec(prepared);
      if (found) {
        flush();
        nodes.push(
          React.createElement(
            "mark",
            { key: nextKey("mark") },
            ...renderNodes(found[1], nextKey("mark-inner"), depth + 1),
          ),
        );
        i = match.lastIndex;
        continue;
      }
    }

    if (char === "h" && /^https?:\/\//i.test(prepared.slice(i, i + 8))) {
      const match = /https?:\/\/[^\s<>()[\]]+/iy;
      match.lastIndex = i;
      const found = match.exec(prepared);
      if (found) {
        let url = found[0];
        let trailing = "";
        while (/[.,;:!?]$/.test(url)) {
          trailing = url.slice(-1) + trailing;
          url = url.slice(0, -1);
        }
        flush();
        const href = safeUrl(url);
        if (href) {
          nodes.push(
            React.createElement(
              "a",
              {
                key: nextKey("url"),
                href,
                className: "md-link",
                target: "_blank",
                rel: "noopener noreferrer",
              },
              url,
            ),
          );
        } else {
          plain += url;
        }
        plain += trailing;
        i += found[0].length;
        continue;
      }
    }

    plain += char;
    i += 1;
  }

  flush();
  return nodes;
}

export function renderInline(text: string, keyPrefix = "inline"): ReactNode[] {
  return renderNodes(text, keyPrefix, 0);
}
