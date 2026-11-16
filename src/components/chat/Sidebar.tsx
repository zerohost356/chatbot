"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Conversation } from "@/lib/types";
import { formatBytes, relativeTime } from "@/lib/utils";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MessageIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  ready: boolean;
  storageBytes: number;
  attachmentBytes: number;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClose?: () => void;
  showClose?: boolean;
}

const STORAGE_REFERENCE = 5 * 1024 * 1024;

function groupLabel(ts: number): string {
  const now = new Date();
  const then = new Date(ts);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (ts >= startToday) return "Today";
  if (ts >= startToday - 86_400_000) return "Yesterday";
  if (ts >= startToday - 6 * 86_400_000) return "Previous 7 days";
  if (then.getFullYear() === now.getFullYear()) return "Earlier this year";
  return "Older";
}

function stripPreview(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code ")
    .replace(/[#>*_`~[\]()|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 130);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}

export default function Sidebar({
  conversations,
  activeId,
  ready,
  storageBytes,
  attachmentBytes,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
  onClose,
  showClose,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onNew();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNew]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      if (conversation.title.toLowerCase().includes(q)) return true;
      return conversation.messages.some((message) => message.content.toLowerCase().includes(q));
    });
  }, [conversations, query]);

  const groups = useMemo(() => {
    const pinned = filtered.filter((c) => c.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
    const rest = filtered.filter((c) => !c.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
    const map = new Map<string, Conversation[]>();
    for (const conversation of rest) {
      const label = groupLabel(conversation.updatedAt);
      const list = map.get(label) ?? [];
      list.push(conversation);
      map.set(label, list);
    }
    const order = ["Today", "Yesterday", "Previous 7 days", "Earlier this year", "Older"];
    const result: { label: string; items: Conversation[] }[] = [];
    if (pinned.length) result.push({ label: "Pinned", items: pinned });
    for (const label of order) {
      const items = map.get(label);
      if (items?.length) result.push({ label, items });
    }
    return result;
  }, [filtered]);

  const startRename = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setDraft(conversation.title);
    window.setTimeout(() => inputRef.current?.select(), 20);
  };

  const commitRename = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  const usage = Math.min(100, Math.round((storageBytes / STORAGE_REFERENCE) * 100));

  return (
    <aside className="sidebar" aria-label="Conversation history">
      <div className="sidebar-head">
        <Logo size={32} />
        {showClose ? (
          <button type="button" className="icon-btn subtle sidebar-close" onClick={onClose} aria-label="Close sidebar">
            <XIcon size={17} />
          </button>
        ) : null}
      </div>

      <div className="sidebar-top">
        <button type="button" className="new-chat-btn" onClick={onNew}>
          <span className="new-chat-icon">
            <PlusIcon size={16} />
          </span>
          <span>New conversation</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="sidebar-search">
          <SearchIcon size={15} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <XIcon size={13} />
            </button>
          ) : null}
        </div>
        {query ? (
          <p className="search-count">
            {filtered.length} {filtered.length === 1 ? "thread" : "threads"} found
          </p>
        ) : null}
      </div>

      <div className="sidebar-list">
        {!ready ? (
          <div className="sidebar-skeleton" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
        ) : groups.length === 0 ? (
          <div className="sidebar-empty">
            <MessageIcon size={20} />
            <p>{query ? "No conversations match that search." : "No conversations yet."}</p>
            {!query ? <span>Start a thread and it will appear here.</span> : null}
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = Boolean(collapsed[group.label]);
            return (
              <section className="thread-group" key={group.label}>
                <button
                  type="button"
                  className="thread-group-label"
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [group.label]: !prev[group.label] }))
                  }
                  aria-expanded={!isCollapsed}
                >
                  <span>{group.label}</span>
                  <span className="thread-group-count">{group.items.length}</span>
                  {isCollapsed ? <ChevronRightIcon size={13} /> : <ChevronDownIcon size={13} />}
                </button>
                {!isCollapsed
                  ? group.items.map((conversation) => {
                      const last = conversation.messages[conversation.messages.length - 1];
                      const preview = last ? stripPreview(last.content || (last.reasoning ?? "")) : "";
                      const isActive = conversation.id === activeId;
                      const isEditing = editingId === conversation.id;
                      return (
                        <div
                          className={`thread-row${isActive ? " is-active" : ""}`}
                          key={conversation.id}
                        >
                          <button
                            type="button"
                            className="thread-main"
                            onClick={() => onSelect(conversation.id)}
                            aria-current={isActive ? "true" : undefined}
                          >
                            <span className="thread-title-row">
                              <span className="thread-title">
                                <Highlight text={conversation.title} query={query} />
                              </span>
                              <span className="thread-time">{relativeTime(conversation.updatedAt)}</span>
                            </span>
                            <span className="thread-preview">
                              {conversation.pinned ? <PinIcon size={11} className="thread-pin" /> : null}
                              {preview || "Empty conversation"}
                            </span>
                          </button>
                          <div className="thread-actions">
                            <button
                              type="button"
                              className="thread-action"
                              onClick={() => onTogglePin(conversation.id)}
                              aria-label={conversation.pinned ? "Unpin conversation" : "Pin conversation"}
                              title={conversation.pinned ? "Unpin" : "Pin"}
                            >
                              {conversation.pinned ? <PinOffIcon size={14} /> : <PinIcon size={14} />}
                            </button>
                            <button
                              type="button"
                              className="thread-action"
                              onClick={() => startRename(conversation)}
                              aria-label="Rename conversation"
                              title="Rename"
                            >
                              <PencilIcon size={14} />
                            </button>
                            <button
                              type="button"
                              className="thread-action danger"
                              onClick={() => onDelete(conversation.id)}
                              aria-label="Delete conversation"
                              title="Delete"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                          {isEditing ? (
                            <div className="thread-rename">
                              <input
                                ref={inputRef}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onBlur={commitRename}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    commitRename();
                                  }
                                  if (event.key === "Escape") setEditingId(null);
                                }}
                                aria-label="Conversation title"
                                maxLength={120}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  : null}
              </section>
            );
          })
        )}
      </div>

      <div className="sidebar-foot">
        <div className="storage-card">
          <div className="storage-top">
            <span className="storage-label">Local storage</span>
            <span className="storage-value">{formatBytes(storageBytes)}</span>
          </div>
          <div className="storage-track" role="progressbar" aria-valuenow={usage} aria-valuemin={0} aria-valuemax={100}>
            <span className={`storage-fill${usage > 85 ? " is-hot" : ""}`} style={{ width: `${Math.max(4, usage)}%` }} />
          </div>
          <div className="storage-sub">
            <span>{conversations.length} threads</span>
            <span>{formatBytes(attachmentBytes)} attachments</span>
          </div>
        </div>
        <div className="sidebar-legal">
          <a href="/terms">Terms</a>
          <span aria-hidden="true">·</span>
          <a href="/privacy">Privacy</a>
          <span className="sidebar-legal-spacer" />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
