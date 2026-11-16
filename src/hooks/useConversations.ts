"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Conversation } from "@/lib/types";
import {
  loadConversations,
  persistConversations,
  removeConversationStorage,
} from "@/lib/storage";
import { createConversation } from "@/lib/chat";

type Tone = "info" | "success" | "error" | "busy";
type Notify = (message: string, tone?: Tone) => void;

export function useConversations({
  routeId,
  preserveId,
  notify,
  defaultModel,
}: {
  routeId?: string | null;
  preserveId?: string | null;
  notify: Notify;
  defaultModel: string;
}) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [ready, setReady] = useState(false);
  const notifyRef = useRef(notify);
  const defaultModelRef = useRef(defaultModel);
  const trimmedRef = useRef(false);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    defaultModelRef.current = defaultModel;
  }, [defaultModel]);

  useEffect(() => {
    const loaded = loadConversations();
    setItems(loaded);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !routeId) return;
    setItems((prev) => {
      if (prev.some((c) => c.id === routeId)) return prev;
      const now = Date.now();
      const shell: Conversation = {
        id: routeId,
        title: "New conversation",
        createdAt: now,
        updatedAt: now,
        model: defaultModelRef.current,
        messages: [],
      };
      return [shell, ...prev];
    });
  }, [ready, routeId]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const result = persistConversations(items, preserveId);
      if (!result.ok) {
        notifyRef.current(
          "Browser storage is full. Export a conversation, then remove older threads.",
          "error",
        );
        return;
      }
      if (result.droppedConversations || result.droppedPayloads) {
        if (!trimmedRef.current) {
          trimmedRef.current = true;
          const parts: string[] = [];
          if (result.droppedConversations) {
            parts.push(`${result.droppedConversations} older conversation${result.droppedConversations > 1 ? "s" : ""}`);
          }
          if (result.droppedPayloads) {
            parts.push("large attachment previews");
          }
          notifyRef.current(`Storage was full — removed ${parts.join(" and ")}. Export important threads often.`, "error");
          window.setTimeout(() => {
            trimmedRef.current = false;
          }, 6000);
        }
        setItems(result.conversations);
      }
    }, 480);
    return () => window.clearTimeout(timer);
  }, [items, ready, preserveId]);

  const create = useCallback((model?: string) => {
    const conversation = createConversation(model ?? defaultModelRef.current);
    setItems((prev) => [conversation, ...prev]);
    return conversation;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Conversation> | ((conversation: Conversation) => Conversation)) => {
      setItems((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== id) return conversation;
          if (typeof patch === "function") return patch(conversation);
          return { ...conversation, ...patch, updatedAt: Date.now() };
        }),
      );
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((conversation) => conversation.id !== id));
  }, []);

  const rename = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setItems((prev) =>
        prev.map((conversation) =>
          conversation.id === id
            ? { ...conversation, title: trimmed.slice(0, 120), updatedAt: Date.now() }
            : conversation,
        ),
      );
    },
    [],
  );

  const togglePin = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((conversation) =>
        conversation.id === id
          ? { ...conversation, pinned: !conversation.pinned, updatedAt: Date.now() }
          : conversation,
      ),
    );
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    removeConversationStorage();
  }, []);

  const setConversations = useCallback((next: Conversation[]) => {
    setItems(next);
  }, []);

  const totalAttachmentBytes = useMemo(
    () =>
      items.reduce(
        (sum, conversation) =>
          sum +
          conversation.messages.reduce(
            (inner, message) =>
              inner + (message.attachments ?? []).reduce((a, attachment) => a + attachment.size, 0),
            0,
          ),
        0,
      ),
    [items],
  );

  return {
    conversations: items,
    ready,
    create,
    update,
    remove,
    rename,
    togglePin,
    clearAll,
    setConversations,
    totalAttachmentBytes,
  };
}
