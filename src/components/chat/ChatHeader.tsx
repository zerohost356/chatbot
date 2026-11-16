"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ModelInfo } from "@/lib/types";
import ModelPicker from "./ModelPicker";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  CheckIcon,
  MenuIcon,
  MinimizeIcon,
  PanelRightIcon,
  PencilIcon,
  ShareIcon,
} from "@/components/ui/icons";

interface ChatHeaderProps {
  title: string;
  onRename: (title: string) => void;
  onMenu: () => void;
  onToggleInfo: () => void;
  onToggleFocus: () => void;
  onCopyLink: () => void;
  infoOpen: boolean;
  focusMode: boolean;
  streaming: boolean;
  models: ModelInfo[];
  model: string;
  onModelChange: (id: string) => void;
  mode: "live" | "demo";
}

export default function ChatHeader({
  title,
  onRename,
  onMenu,
  onToggleInfo,
  onToggleFocus,
  onCopyLink,
  infoOpen,
  focusMode,
  streaming,
  models,
  model,
  onModelChange,
  mode,
}: ChatHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== title) onRename(next);
    else setDraft(title);
    setEditing(false);
  };

  return (
    <header className="chat-header">
      <button type="button" className="icon-btn header-menu" onClick={onMenu} aria-label="Open conversation history">
        <MenuIcon size={18} />
      </button>

      <div className="header-title-wrap">
        {editing ? (
          <input
            ref={inputRef}
            className="header-title-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") {
                setDraft(title);
                setEditing(false);
              }
            }}
            autoFocus
            maxLength={120}
            aria-label="Conversation title"
          />
        ) : (
          <button
            type="button"
            className="header-title"
            onClick={() => {
              setEditing(true);
              setDraft(title);
            }}
            title="Rename conversation"
          >
            <span className="header-title-text">{title || "New conversation"}</span>
            <PencilIcon size={12} className="header-title-pencil" />
          </button>
        )}
        <div className="header-sub">
          {streaming ? (
            <span className="header-status is-live">
              <span className="status-dot" /> Generating
            </span>
          ) : (
            <span className="header-status">
              <CheckIcon size={11} /> Ready
            </span>
          )}
          <span className="header-sep" aria-hidden="true">·</span>
          <span className="header-mode">{mode === "live" ? "Live models" : "Demo mode"}</span>
        </div>
      </div>

      <div className="header-model">
        <ModelPicker models={models} value={model} onChange={onModelChange} mode={mode} align="right" />
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onCopyLink}
          aria-label="Copy conversation link"
          title="Copy link"
        >
          <ShareIcon size={17} />
        </button>
        <button
          type="button"
          className={`icon-btn${focusMode ? " is-active" : ""}`}
          onClick={onToggleFocus}
          aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
          aria-pressed={focusMode}
          title="Focus mode"
        >
          <MinimizeIcon size={17} />
        </button>
        <button
          type="button"
          className={`icon-btn${infoOpen ? " is-active" : ""}`}
          onClick={onToggleInfo}
          aria-label={infoOpen ? "Close info panel" : "Open info panel"}
          aria-pressed={infoOpen}
          title="Conversation info"
        >
          <PanelRightIcon size={17} />
        </button>
        <ThemeToggle className="header-theme" />
      </div>
    </header>
  );
}
