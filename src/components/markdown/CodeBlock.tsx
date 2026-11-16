"use client";

import React, { useMemo, useState } from "react";
import { highlight, languageLabel, splitTokensByLine } from "@/lib/markdown/highlight";
import { copyText } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

interface CodeBlockProps {
  code: string;
  lang: string | null;
  lineNumbers?: boolean;
  wrap?: boolean;
  streaming?: boolean;
}

export default function CodeBlock({
  code,
  lang,
  lineNumbers = true,
  wrap = false,
  streaming = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const trimmed = code.replace(/\n$/, "");
  const lines = useMemo(() => splitTokensByLine(highlight(trimmed, lang)), [trimmed, lang]);
  const lineCount = Math.max(1, lines.length);

  const handleCopy = async () => {
    const ok = await copyText(trimmed);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <figure className={`code-block${wrap ? " is-wrapped" : ""}`}>
      <figcaption className="code-head">
        <span className="code-lang">
          <span className="code-lang-dot" />
          {languageLabel(lang)}
        </span>
        <span className="code-meta">
          <span className="code-lines">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
          {streaming ? <span className="code-stream">streaming</span> : null}
          <button
            type="button"
            className={`code-copy${copied ? " is-copied" : ""}`}
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </span>
      </figcaption>
      <div className="code-scroll">
        <pre className="code-pre" aria-label={`${languageLabel(lang)} code`}>
          <code>
            {lines.map((tokens, index) => (
              <span className="code-line" key={index}>
                {lineNumbers ? (
                  <span className="code-ln" aria-hidden="true">
                    {index + 1}
                  </span>
                ) : null}
                <span className="code-line-content">
                  {tokens.length === 0 ? (
                    <span> </span>
                  ) : (
                    tokens.map((token, tokenIndex) => (
                      <span key={tokenIndex} className={`tok-${token.type}`}>
                        {token.text}
                      </span>
                    ))
                  )}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  );
}
