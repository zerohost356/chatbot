"use client";

import React, { useMemo, useState } from "react";
import type { Conversation, ModelInfo, ViewPreferences } from "@/lib/types";
import { conversationToMarkdown, conversationToJSON, downloadConversationJSON, downloadConversationMarkdown } from "@/lib/export";
import { friendlyModelName, getConversationStats, MAX_CONTEXT_CHARS, contextPercent } from "@/lib/chat";
import { copyText, formatBytes, formatDate, formatTime, relativeTime } from "@/lib/utils";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DatabaseIcon,
  DownloadIcon,
  ExternalIcon,
  FileIcon,
  LockIcon,
  ScaleIcon,
  SlidersIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import { AttachmentChips } from "./AttachmentChips";
import Modal from "@/components/ui/Modal";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

interface InfoPanelProps {
  conversation: Conversation | null;
  models: ModelInfo[];
  mode: "live" | "demo";
  prefs: ViewPreferences;
  onPrefsChange: (patch: Partial<ViewPreferences>) => void;
  shareUrl: string;
  storageBytes: number;
  attachmentBytes: number;
  conversationCount: number;
  onClose: () => void;
  onClearAll: () => void;
  onDeleteConversation: () => void;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="info-stat">
      <span className="info-stat-value">{value}</span>
      <span className="info-stat-label">{label}</span>
      {hint ? <span className="info-stat-hint">{hint}</span> : null}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="pref-row">
      <span className="pref-copy">
        <span className="pref-label">{label}</span>
        <span className="pref-hint">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch${checked ? " is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </label>
  );
}

export default function InfoPanel({
  conversation,
  models,
  mode,
  prefs,
  onPrefsChange,
  shareUrl,
  storageBytes,
  attachmentBytes,
  conversationCount,
  onClose,
  onClearAll,
  onDeleteConversation,
}: InfoPanelProps) {
  const { notify } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stats = useMemo(() => getConversationStats(conversation), [conversation]);
  const attachments = useMemo(
    () => (conversation?.messages ?? []).flatMap((message) => message.attachments ?? []),
    [conversation],
  );
  const context = Math.min(MAX_CONTEXT_CHARS, stats.characters);
  const contextPct = contextPercent(context);
  const storagePct = Math.min(100, Math.round((storageBytes / (5 * 1024 * 1024)) * 100));
  const modelLabel = conversation ? friendlyModelName(conversation.model, models) : "No model";
  const title = conversation?.title ?? "No conversation";

  const copy = async (value: string, key: string, message: string) => {
    const ok = await copyText(value);
    if (!ok) {
      notify("Could not access the clipboard.", "error");
      return;
    }
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1700);
    notify(message, "success");
  };

  return (
    <aside className="info-panel" aria-label="Conversation information">
      <div className="info-head">
        <div>
          <h2 className="info-title">Details</h2>
          <p className="info-sub">Thread metadata, exports, and view settings.</p>
        </div>
        <button type="button" className="icon-btn subtle" onClick={onClose} aria-label="Close info panel">
          <XIcon size={16} />
        </button>
      </div>

      <div className="info-scroll">
        <section className="info-section">
          <div className="info-conv-card">
            <span className="info-conv-icon">
              <SparklesIcon size={17} />
            </span>
            <div className="info-conv-copy">
              <h3>{title}</h3>
              <p>
                {modelLabel} · {mode === "live" ? "LiteRouter" : "Demo"} · updated{" "}
                {conversation ? relativeTime(conversation.updatedAt) : "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h3 className="info-section-title">
            <DatabaseIcon size={14} /> Overview
          </h3>
          <div className="info-stats">
            <Stat label="Messages" value={String(stats.messages)} hint={`${stats.userMessages} you / ${stats.assistantMessages} Aurora`} />
            <Stat label="Words" value={stats.words.toLocaleString("en-US")} />
            <Stat label="Est. tokens" value={stats.tokens.toLocaleString("en-US")} />
            <Stat label="Attachments" value={String(stats.attachments)} hint={formatBytes(stats.attachmentBytes)} />
          </div>
          <div className="meter">
            <div className="meter-head">
              <span>Context budget</span>
              <span>{contextPct}%</span>
            </div>
            <div className="meter-track" role="progressbar" aria-valuenow={contextPct} aria-valuemin={0} aria-valuemax={100}>
              <span className={`meter-fill${contextPct > 85 ? " is-hot" : ""}`} style={{ width: `${Math.max(2, contextPct)}%` }} />
            </div>
            <p className="meter-foot">
              ~{context.toLocaleString("en-US")} of {MAX_CONTEXT_CHARS.toLocaleString("en-US")} chars · oldest turns are trimmed first
            </p>
          </div>
        </section>

        <section className="info-section">
          <h3 className="info-section-title">
            <ExternalIcon size={14} /> Share link
          </h3>
          <div className="share-box">
            <code>{shareUrl || "—"}</code>
            <button
              type="button"
              className="icon-btn subtle"
              onClick={() => void copy(shareUrl, "link", "Conversation link copied.")}
              aria-label="Copy conversation link"
              disabled={!shareUrl}
            >
              {copied === "link" ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
            </button>
          </div>
          <p className="info-note">
            <LockIcon size={12} /> The link points to a local conversation. History is not uploaded.
          </p>
        </section>

        <section className="info-section">
          <h3 className="info-section-title">
            <DownloadIcon size={14} /> Export
          </h3>
          <div className="export-grid">
            <button
              type="button"
              className="export-btn"
              disabled={!conversation}
              onClick={() => {
                if (!conversation) return;
                void copy(conversationToMarkdown(conversation), "thread", "Thread copied as Markdown.");
              }}
            >
              <span className="export-icon">{copied === "thread" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}</span>
              <span>
                <strong>Copy thread</strong>
                <small>Markdown source</small>
              </span>
            </button>
            <button
              type="button"
              className="export-btn"
              disabled={!conversation}
              onClick={() => {
                if (!conversation) return;
                downloadConversationMarkdown(conversation);
                notify("Markdown download started.", "success");
              }}
            >
              <span className="export-icon"><DownloadIcon size={16} /></span>
              <span>
                <strong>Markdown</strong>
                <small>.md file</small>
              </span>
            </button>
            <button
              type="button"
              className="export-btn"
              disabled={!conversation}
              onClick={() => {
                if (!conversation) return;
                downloadConversationJSON(conversation);
                notify("JSON download started.", "success");
              }}
            >
              <span className="export-icon"><FileIcon size={16} /></span>
              <span>
                <strong>Structured JSON</strong>
                <small>Full metadata</small>
              </span>
            </button>
            <button
              type="button"
              className="export-btn"
              disabled={!conversation}
              onClick={() => {
                if (!conversation) return;
                void copy(conversationToJSON(conversation), "json", "Thread copied as JSON.");
              }}
            >
              <span className="export-icon">{copied === "json" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}</span>
              <span>
                <strong>Copy JSON</strong>
                <small>Clipboard</small>
              </span>
            </button>
          </div>
        </section>

        {attachments.length ? (
          <section className="info-section">
            <h3 className="info-section-title">
              <FileIcon size={14} /> Attachments
              <span className="info-count">{attachments.length}</span>
            </h3>
            <AttachmentChips attachments={attachments} />
            <p className="info-note">
              Total {formatBytes(stats.attachmentBytes)}. Text excerpts are trimmed first when storage is full.
            </p>
          </section>
        ) : null}

        <section className="info-section">
          <h3 className="info-section-title">
            <SlidersIcon size={14} /> View
          </h3>
          <div className="pref-list">
            <Toggle
              label="Line numbers"
              hint="Show a gutter inside code blocks"
              checked={prefs.lineNumbers}
              onChange={(next) => onPrefsChange({ lineNumbers: next })}
            />
            <Toggle
              label="Wrap code"
              hint="Wrap long lines instead of scrolling"
              checked={prefs.wrapCode}
              onChange={(next) => onPrefsChange({ wrapCode: next })}
            />
            <Toggle
              label="Timestamps"
              hint="Show local time beside messages"
              checked={prefs.showTimestamps}
              onChange={(next) => onPrefsChange({ showTimestamps: next })}
            />
          </div>
          <div className="theme-row">
            <span>
              <strong>Theme</strong>
              <small>Follows your preference</small>
            </span>
            <ThemeToggle />
          </div>
        </section>

        <section className="info-section">
          <h3 className="info-section-title">
            <DatabaseIcon size={14} /> Storage
          </h3>
          <div className="meter">
            <div className="meter-head">
              <span>{conversationCount} conversations</span>
              <span>{formatBytes(storageBytes)}</span>
            </div>
            <div className="meter-track" role="progressbar" aria-valuenow={storagePct} aria-valuemin={0} aria-valuemax={100}>
              <span className={`meter-fill${storagePct > 85 ? " is-hot" : ""}`} style={{ width: `${Math.max(3, storagePct)}%` }} />
            </div>
            <p className="meter-foot">
              Attachments use {formatBytes(attachmentBytes)}. Everything is stored in this browser.
            </p>
          </div>
        </section>

        <section className="info-section">
          <h3 className="info-section-title">
            <ClockIcon size={14} /> Timeline
          </h3>
          <ul className="timeline">
            <li>
              <span>Created</span>
              <strong>{conversation ? formatDate(conversation.createdAt) : "—"}</strong>
            </li>
            <li>
              <span>Last message</span>
              <strong>
                {conversation?.messages.length
                  ? formatTime(conversation.messages[conversation.messages.length - 1].createdAt)
                  : "—"}
              </strong>
            </li>
            <li>
              <span>Provider</span>
              <strong>{mode === "live" ? "LiteRouter API" : "Local demo"}</strong>
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h3 className="info-section-title">
            <ScaleIcon size={14} /> Legal
          </h3>
          <div className="legal-links">
            <a href="/terms">
              Terms of Service <ExternalIcon size={13} />
            </a>
            <a href="/privacy">
              Privacy Policy <ExternalIcon size={13} />
            </a>
          </div>
        </section>

        <section className="info-section danger-zone">
          <h3 className="info-section-title">
            <TrashIcon size={14} /> Danger zone
          </h3>
          <button
            type="button"
            className="danger-btn"
            disabled={!conversation}
            onClick={() => setConfirmDelete(true)}
          >
            Delete this conversation
          </button>
          <button type="button" className="danger-btn subtle" onClick={() => setConfirmClear(true)}>
            Clear all local history
          </button>
        </section>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete this conversation?"
        description="This removes the thread from this browser. Export a copy first if you need it."
        tone="danger"
        size="sm"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                setConfirmDelete(false);
                onDeleteConversation();
              }}
            >
              Delete thread
            </button>
          </>
        }
      />

      <Modal
        open={confirmClear}
        title="Clear all history?"
        description="Every conversation and attachment preview in this browser will be removed. This cannot be undone."
        tone="danger"
        size="sm"
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setConfirmClear(false)}>
              Keep history
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                setConfirmClear(false);
                onClearAll();
              }}
            >
              Clear everything
            </button>
          </>
        }
      />
    </aside>
  );
}
