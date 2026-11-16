"use client";

import React from "react";
import {
  BrainIcon,
  DownloadIcon,
  FileIcon,
  GlobeIcon,
  ImageIcon,
  LockIcon,
  SparklesIcon,
  TableIcon,
  ZapIcon,
} from "@/components/ui/icons";

interface EmptyStateProps {
  onPrompt: (prompt: string) => void;
  modelName: string;
  mode: "live" | "demo";
}

const SUGGESTIONS = [
  {
    icon: <SparklesIcon size={18} />,
    title: "Markdown playground",
    body: "See headings, tables, task lists, quotes, and links in one answer.",
    prompt: "Show me the full Markdown playground and explain what the renderer supports.",
  },
  {
    icon: <ZapIcon size={18} />,
    title: "Every language",
    body: "TypeScript, JSON, Bash, Python, SQL, HTML, CSS, YAML — all highlighted.",
    prompt: "Show syntax highlighting for every language the workspace supports.",
  },
  {
    icon: <FileIcon size={18} />,
    title: "Attachments",
    body: "Drag files, paste long text, and see how limits are enforced.",
    prompt: "Explain the attachment limits and how drag, drop, and paste work.",
  },
  {
    icon: <DownloadIcon size={18} />,
    title: "Export a thread",
    body: "Copy messages or download the whole conversation as Markdown or JSON.",
    prompt: "Design a conversation export flow with Markdown and JSON downloads.",
  },
];

const CHIPS = [
  { icon: <BrainIcon size={13} />, label: "Reasoning traces" },
  { icon: <TableIcon size={13} />, label: "GFM tables" },
  { icon: <GlobeIcon size={13} />, label: "Stable /c/ links" },
  { icon: <ImageIcon size={13} />, label: "Image context" },
  { icon: <LockIcon size={13} />, label: "Local-first history" },
];

export default function EmptyState({ onPrompt, modelName, mode }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-glow" aria-hidden="true" />
      <div className="empty-orb-wrap" aria-hidden="true">
        <span className="empty-orb" />
        <span className="empty-orbit orbit-a" />
        <span className="empty-orbit orbit-b" />
        <span className="empty-star star-a" />
        <span className="empty-star star-b" />
        <span className="empty-star star-c" />
      </div>

      <p className="empty-kicker">
        <span className="live-dot" />
        {mode === "live" ? "Connected to LiteRouter" : "Local demo mode"} · {modelName}
      </p>
      <h1 className="empty-title">
        What should we <span className="gradient-text">explore</span> today?
      </h1>
      <p className="empty-sub">
        Ask anything, attach a file, or start with one of these. Answers stream in as they are written,
        with a separate reasoning trace when the model exposes one.
      </p>

      <div className="suggestion-grid">
        {SUGGESTIONS.map((suggestion, index) => (
          <button
            type="button"
            className="suggestion-card"
            key={suggestion.title}
            onClick={() => onPrompt(suggestion.prompt)}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span className="suggestion-icon">{suggestion.icon}</span>
            <span className="suggestion-copy">
              <span className="suggestion-title">{suggestion.title}</span>
              <span className="suggestion-body">{suggestion.body}</span>
            </span>
            <span className="suggestion-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      <div className="empty-chips">
        {CHIPS.map((chip) => (
          <span className="empty-chip" key={chip.label}>
            {chip.icon}
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}
