"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Attachment } from "@/lib/types";
import { MAX_MESSAGE_CHARS } from "@/lib/chat";
import { MAX_FILES, pastedTextAttachment, readFiles } from "@/lib/attachments";
import { formatBytes } from "@/lib/utils";
import {
  AlertIcon,
  PaperclipIcon,
  SendIcon,
  StopIcon,
  ZapIcon,
} from "@/components/ui/icons";
import { AttachmentChips } from "./AttachmentChips";
import { useToast } from "@/components/ui/Toast";

interface ComposerProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  streaming: boolean;
  ready: boolean;
  visionEnabled: boolean;
  modelName: string;
  mode: "live" | "demo";
}

export default function Composer({
  onSend,
  onStop,
  streaming,
  ready,
  visionEnabled,
  modelName,
  mode,
}: ComposerProps) {
  const { notify } = useToast();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    setReading(true);
    try {
      const { added, errors } = await readFiles(files, attachments, { visionEnabled });
      if (added.length) setAttachments((prev) => [...prev, ...added]);
      errors.forEach((error) => notify(error, "error"));
    } finally {
      setReading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if (streaming || !ready) return;
    const trimmed = text.trim();
    if (!trimmed && !attachments.length) {
      textareaRef.current?.focus();
      return;
    }
    if (trimmed.length > MAX_MESSAGE_CHARS) {
      notify(`Messages are limited to ${MAX_MESSAGE_CHARS.toLocaleString("en-US")} characters.`, "error");
      return;
    }
    onSend(trimmed, attachments);
    setText("");
    setAttachments([]);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files ?? []);
    if (files.length) {
      event.preventDefault();
      void addFiles(files);
      return;
    }
    const pasted = event.clipboardData.getData("text");
    const selection = text.slice(
      event.currentTarget.selectionStart ?? text.length,
      event.currentTarget.selectionEnd ?? text.length,
    );
    if (pasted.length > 6000 && !selection) {
      event.preventDefault();
      if (attachments.length >= MAX_FILES) {
        notify(`You can attach up to ${MAX_FILES} files.`, "error");
        return;
      }
      setAttachments((prev) => [...prev, pastedTextAttachment(pasted)]);
      notify(`Long paste moved into a text attachment (${pasted.length.toLocaleString("en-US")} chars).`, "info");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  };

  const fill = Math.min(100, Math.round((text.length / MAX_MESSAGE_CHARS) * 100));
  const showCounter = text.length > MAX_MESSAGE_CHARS * 0.55;
  const canSend = ready && !streaming && (text.trim().length > 0 || attachments.length > 0);

  return (
    <div
      className={`composer-wrap${dragging ? " is-dragging" : ""}`}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const files = Array.from(event.dataTransfer.files ?? []);
        void addFiles(files);
      }}
    >
      <div className="composer">
        {dragging ? (
          <div className="drop-overlay" aria-hidden="true">
            <PaperclipIcon size={20} />
            <span>Drop files to attach</span>
          </div>
        ) : null}

        {attachments.length ? (
          <div className="composer-attachments">
            <AttachmentChips
              attachments={attachments}
              onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
            />
            <p className="composer-attachment-summary">
              {attachments.length} / {MAX_FILES} files ·{" "}
              {formatBytes(attachments.reduce((sum, a) => sum + a.size, 0))}
            </p>
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          className="composer-input"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_MESSAGE_CHARS))}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            streaming
              ? "Aurora is responding…"
              : "Message Aurora — ask anything, paste text, or drop a file"
          }
          rows={1}
          maxLength={MAX_MESSAGE_CHARS}
          disabled={!ready}
          aria-label="Message Aurora"
        />

        <div className="composer-bar">
          <div className="composer-tools">
            <button
              type="button"
              className="composer-tool"
              onClick={() => fileInputRef.current?.click()}
              disabled={reading}
              aria-label="Attach files"
              title="Attach files"
            >
              <PaperclipIcon size={16} />
              <span>{reading ? "Reading…" : "Attach"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(event) => void addFiles(Array.from(event.target.files ?? []))}
            />
            <span className="composer-model" title={`Model: ${modelName}`}>
              <ZapIcon size={13} />
              <span className="composer-model-name">{modelName}</span>
              <span className={`mode-dot mode-${mode}`} aria-label={mode === "live" ? "Live" : "Demo"} />
            </span>
          </div>

          <div className="composer-actions">
            {showCounter ? (
              <span className={`char-count${fill > 95 ? " is-warn" : ""}`}>
                {text.length.toLocaleString("en-US")} / {MAX_MESSAGE_CHARS.toLocaleString("en-US")}
              </span>
            ) : null}
            {streaming ? (
              <button type="button" className="send-btn stop-btn" onClick={onStop} aria-label="Stop generating">
                <StopIcon size={16} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                className="send-btn"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
              >
                <SendIcon size={17} />
              </button>
            )}
          </div>
        </div>

        <div className="composer-hint">
          <span>
            <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
          </span>
          {!visionEnabled ? (
            <span className="composer-warn">
              <AlertIcon size={12} /> No image input
            </span>
          ) : null}
        </div>
      </div>
      <p className="composer-disclaimer">
        Aurora can make mistakes. Verify important details. History stays in this browser.
      </p>
    </div>
  );
}
