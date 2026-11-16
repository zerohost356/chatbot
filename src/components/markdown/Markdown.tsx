"use client";

import React, { memo, useMemo } from "react";
import { parseMarkdown, type Block, type ListItem } from "@/lib/markdown/parse";
import { renderInline } from "@/lib/markdown/inline";
import CodeBlock from "./CodeBlock";

export interface MarkdownPrefs {
  lineNumbers: boolean;
  wrapCode: boolean;
}

interface MarkdownProps {
  content: string;
  streaming?: boolean;
  prefs?: MarkdownPrefs;
  className?: string;
}

function headingId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[`*_~[\]()#!]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 48) || "section"
  );
}

function renderListItem(item: ListItem, index: number, prefs: MarkdownPrefs) {
  return (
    <li
      key={index}
      className={item.checked !== null ? `md-task${item.checked ? " is-checked" : ""}` : undefined}
    >
      {item.checked !== null ? (
        <span className="md-checkbox" aria-hidden="true">
          {item.checked ? (
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m2 6 2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
      ) : null}
      <div className="md-li-body">
        {item.blocks.map((block, blockIndex) => (
          <BlockView key={blockIndex} block={block} prefs={prefs} depth={0} />
        ))}
      </div>
    </li>
  );
}

function BlockView({
  block,
  prefs,
  depth,
}: {
  block: Block;
  prefs: MarkdownPrefs;
  depth: number;
}) {
  switch (block.type) {
    case "heading": {
      const level = Math.min(6, Math.max(1, block.level));
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return React.createElement(
        Tag,
        { className: `md-h md-h${level}`, id: headingId(block.text) },
        ...renderInline(block.text, `h-${level}`),
      );
    }
    case "paragraph":
      return <p className="md-p">{renderInline(block.text, "p")}</p>;
    case "code":
      return (
        <CodeBlock
          code={block.code}
          lang={block.lang}
          lineNumbers={prefs.lineNumbers}
          wrap={prefs.wrapCode}
          streaming={!block.closed}
        />
      );
    case "blockquote":
      return (
        <blockquote className="md-quote">
          {block.children.map((child, index) => (
            <BlockView key={index} block={child} prefs={prefs} depth={depth + 1} />
          ))}
        </blockquote>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`md-list${block.items.some((item) => item.checked !== null) ? " has-tasks" : ""}`}
          start={block.ordered ? block.start : undefined}
        >
          {block.items.map((item, index) => renderListItem(item, index, prefs))}
        </Tag>
      );
    }
    case "table":
      return (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                {block.header.map((cell, index) => (
                  <th key={index} style={{ textAlign: block.align[index] ?? undefined }}>
                    {renderInline(cell, `th-${index}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {block.header.map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      style={{ textAlign: block.align[cellIndex] ?? undefined }}
                    >
                      {renderInline(row[cellIndex] ?? "", `td-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr className="md-hr" />;
    default:
      return null;
  }
}

function Markdown({ content, streaming = false, prefs, className }: MarkdownProps) {
  const options: MarkdownPrefs = prefs ?? { lineNumbers: true, wrapCode: false };
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={`markdown${className ? ` ${className}` : ""}`}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} prefs={options} depth={0} />
      ))}
      {streaming ? <span className="stream-caret" aria-hidden="true" /> : null}
    </div>
  );
}

export default memo(Markdown);
