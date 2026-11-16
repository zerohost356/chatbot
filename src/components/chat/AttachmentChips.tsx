"use client";

import React, { useState } from "react";
import type { Attachment } from "@/lib/types";
import { attachmentKindLabel } from "@/lib/attachments";
import { copyText, formatBytes } from "@/lib/utils";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileIcon,
  ImageIcon,
  XIcon,
} from "@/components/ui/icons";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { downloadText } from "@/lib/export";

interface AttachmentChipsProps {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  align?: "start" | "end";
}

export function AttachmentChips({ attachments, onRemove, align = "start" }: AttachmentChipsProps) {
  const [preview, setPreview] = useState<Attachment | null>(null);
  if (!attachments.length) return null;

  return (
    <div className={`attachment-chips align-${align}`}>
      {attachments.map((attachment) => {
        const isImage = attachment.kind === "image" && attachment.content;
        return (
          <div className={`attachment-chip${isImage ? " is-image" : ""}`} key={attachment.id}>
            {isImage ? (
              <button
                type="button"
                className="attachment-thumb"
                onClick={() => setPreview(attachment)}
                aria-label={`Preview ${attachment.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachment.content} alt={attachment.name} />
              </button>
            ) : (
              <button
                type="button"
                className="attachment-body"
                onClick={() => setPreview(attachment)}
                title={attachment.name}
              >
                <span className="attachment-icon">
                  {attachment.kind === "image" ? <ImageIcon size={15} /> : <FileIcon size={15} />}
                </span>
                <span className="attachment-text">
                  <span className="attachment-name">{attachment.name}</span>
                  <span className="attachment-meta">
                    {attachmentKindLabel(attachment)} · {formatBytes(attachment.size)}
                    {attachment.truncated ? " · truncated" : ""}
                  </span>
                </span>
              </button>
            )}
            {onRemove ? (
              <button
                type="button"
                className="attachment-remove"
                onClick={() => onRemove(attachment.id)}
                aria-label={`Remove ${attachment.name}`}
              >
                <XIcon size={12} />
              </button>
            ) : null}
          </div>
        );
      })}
      <AttachmentPreview attachment={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onClose,
}: {
  attachment: Attachment | null;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  if (!attachment) return null;
  const isImage = attachment.kind === "image" && attachment.content;
  const hasText = attachment.kind === "text" && attachment.content;

  return (
    <Modal
      open={Boolean(attachment)}
      onClose={onClose}
      title={attachment.name}
      description={`${attachmentKindLabel(attachment)} · ${formatBytes(attachment.size)} · ${attachment.type}`}
      size="lg"
      footer={
        <>
          {hasText ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                downloadText(
                  attachment.name.endsWith(".txt") ? attachment.name : `${attachment.name}.txt`,
                  attachment.content ?? "",
                  "text/plain",
                );
              }}
            >
              <DownloadIcon size={15} /> Download
            </button>
          ) : null}
          {hasText ? (
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                const ok = await copyText(attachment.content ?? "");
                if (ok) {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                  notify("Attachment text copied.", "success");
                } else {
                  notify("Could not access the clipboard.", "error");
                }
              }}
            >
              {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              {copied ? "Copied" : "Copy text"}
            </button>
          ) : null}
          <button type="button" className="btn primary" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      {isImage ? (
        <div className="attachment-preview-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment.content} alt={attachment.name} />
        </div>
      ) : hasText ? (
        <pre className="attachment-preview-text">{attachment.content}</pre>
      ) : (
        <div className="attachment-preview-empty">
          <FileIcon size={28} />
          <p>This binary file keeps its name and size only. Its bytes are never uploaded.</p>
        </div>
      )}
      {attachment.truncated ? (
        <p className="attachment-truncate-note">
          Large text was truncated before storage. Only the first characters are available.
        </p>
      ) : null}
    </Modal>
  );
}
