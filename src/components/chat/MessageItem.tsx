"use client";

import React, { useState } from "react";
import type { Message, ViewPreferences } from "@/lib/types";
import { copyText, formatTime } from "@/lib/utils";
import Markdown from "@/components/markdown/Markdown";
import { AttachmentChips } from "./AttachmentChips";
import ReasoningTrace from "./ReasoningTrace";
import {
  AlertIcon,
  CheckIcon,
  CopyIcon,
  RefreshIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";

interface MessageItemProps {
  message: Message;
  prefs: ViewPreferences;
  modelLabel: string;
  streaming?: boolean;
  isLast?: boolean;
  onRetry?: (messageId: string) => void;
}

function TypingIndicator({ label = "Thinking" }: { label?: string }) {
  return (
    <div className="typing" role="status" aria-label={label}>
      <span className="typing-orb">
        <SparklesIcon size={14} />
      </span>
      <span className="typing-dots" aria-hidden="true">
        <i /><i /><i />
      </span>
      <span className="typing-label">{label}</span>
    </div>
  );
}

export default function MessageItem({
  message,
  prefs,
  modelLabel,
  streaming = false,
  isLast = false,
  onRetry,
}: MessageItemProps) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyText(message.content);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      notify("Message copied as Markdown.", "success");
    } else {
      notify("Could not access the clipboard.", "error");
    }
  };

  if (message.role === "user") {
    return (
      <article className="message message-user" aria-label="Your message">
        <div className="message-user-inner">
          <div className="bubble">
            {message.content ? <div className="user-text">{message.content}</div> : null}
            {message.attachments?.length ? (
              <AttachmentChips attachments={message.attachments} align="end" />
            ) : null}
          </div>
          <div className="message-actions user-actions">
            <button
              type="button"
              className="msg-action"
              onClick={handleCopy}
              aria-label="Copy message"
              title="Copy message"
            >
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            {prefs.showTimestamps ? (
              <span className="message-time">{formatTime(message.createdAt)}</span>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  const isEmptyStream = streaming && !message.content && !message.reasoning;
  const showRegenerate = Boolean(onRetry) && isLast && !streaming;

  return (
    <article className={`message message-assistant${message.status === "error" ? " has-error" : ""}`}>
      <div className="assistant-avatar" aria-hidden="true">
        <span className="assistant-orb" />
      </div>
      <div className="assistant-main">
        <header className="assistant-head">
          <span className="assistant-name">Aurora</span>
          <span className="assistant-model">{modelLabel}</span>
          {message.status === "streaming" && message.content ? (
            <span className="status-pill is-live">
              <span className="status-dot" /> Streaming
            </span>
          ) : null}
          {message.status === "stopped" ? <span className="status-pill">Stopped</span> : null}
          {message.status === "error" ? (
            <span className="status-pill is-error">
              <AlertIcon size={11} /> Error
            </span>
          ) : null}
          {prefs.showTimestamps && message.status !== "streaming" ? (
            <span className="message-time">{formatTime(message.createdAt)}</span>
          ) : null}
        </header>

        {message.reasoning ? (
          <ReasoningTrace
            reasoning={message.reasoning}
            streaming={message.status === "streaming"}
            contentStarted={Boolean(message.content)}
            durationMs={message.durationMs}
          />
        ) : null}

        {message.status === "error" ? (
          <div className="message-error">
            <AlertIcon size={16} />
            <div>
              <p>{message.error || "The response could not be completed."}</p>
              {onRetry ? (
                <button type="button" className="btn ghost small" onClick={() => onRetry(message.id)}>
                  <RefreshIcon size={14} /> Try again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {isEmptyStream ? <TypingIndicator label="Thinking" /> : null}

        {message.content ? (
          <Markdown
            content={message.content}
            streaming={streaming}
            prefs={{ lineNumbers: prefs.lineNumbers, wrapCode: prefs.wrapCode }}
          />
        ) : null}

        {message.status === "stopped" && !message.content ? (
          <p className="stopped-note">The response was stopped before any text arrived.</p>
        ) : null}

        <footer className="message-actions assistant-actions">
          <button
            type="button"
            className="msg-action"
            onClick={handleCopy}
            disabled={!message.content}
            aria-label="Copy answer"
            title="Copy answer as Markdown"
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          {showRegenerate ? (
            <button
              type="button"
              className="msg-action"
              onClick={() => onRetry?.(message.id)}
              aria-label="Regenerate answer"
              title="Regenerate answer"
            >
              <RefreshIcon size={14} />
              <span>Regenerate</span>
            </button>
          ) : null}
          {message.durationMs && message.status === "done" ? (
            <span className="message-stat">{(message.durationMs / 1000).toFixed(1)}s</span>
          ) : null}
          {message.usage?.completionTokens ? (
            <span className="message-stat">
              {message.usage.completionTokens.toLocaleString("en-US")} tokens
            </span>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
