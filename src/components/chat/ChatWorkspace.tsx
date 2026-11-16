"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Attachment, Conversation, Message, ViewPreferences } from "@/lib/types";
import {
  buildContext,
  createMessage,
  deriveTitle,
  friendlyModelName,
  FALLBACK_MODEL,
} from "@/lib/chat";
import { estimateConversationBytes, persistConversations, readJSON, readString, writeJSON, writeString, PREFS_KEY, MODEL_KEY } from "@/lib/storage";
import { useConversations } from "@/hooks/useConversations";
import { useModels } from "@/hooks/useModels";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/components/ui/Toast";
import Sidebar from "./Sidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import EmptyState from "./EmptyState";
import Composer from "./Composer";
import InfoPanel from "./InfoPanel";
import Modal from "@/components/ui/Modal";

const DEFAULT_PREFS: ViewPreferences = {
  lineNumbers: true,
  wrapCode: false,
  showTimestamps: true,
};

interface ChatWorkspaceProps {
  conversationId?: string;
}

interface DeleteTarget {
  id: string;
  title: string;
}

export default function ChatWorkspace({ conversationId }: ChatWorkspaceProps) {
  const router = useRouter();
  const { notify } = useToast();
  const { models, mode, loading: modelsLoading, defaultModel } = useModels();
  const isMobile = useIsMobile();

  const [draftModel, setDraftModel] = useState(FALLBACK_MODEL.id);
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [prefs, setPrefs] = useState<ViewPreferences>(DEFAULT_PREFS);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [origin, setOrigin] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const activeIdRef = useRef<string | null>(activeId);
  const prefsLoaded = useRef(false);
  const mountedRef = useRef(true);

  const {
    conversations,
    ready,
    create,
    update,
    remove,
    rename,
    togglePin,
    clearAll,
    totalAttachmentBytes,
  } = useConversations({
    routeId: conversationId,
    preserveId: activeId,
    notify,
    defaultModel: draftModel,
  });

  const active = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  useEffect(() => {
    activeIdRef.current = activeId;
    conversationsRef.current = conversations;
  }, [activeId, conversations]);

  useEffect(() => {
    setOrigin(window.location.origin);
    const storedModel = readString(MODEL_KEY);
    if (storedModel) setDraftModel(storedModel);
    if (window.matchMedia("(min-width: 1281px)").matches) setInfoOpen(true);
    const storedPrefs = readJSON<ViewPreferences>(PREFS_KEY, DEFAULT_PREFS);
    setPrefs({ ...DEFAULT_PREFS, ...storedPrefs });
    prefsLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!prefsLoaded.current) return;
    writeJSON(PREFS_KEY, prefs);
  }, [prefs]);

  useEffect(() => {
    if (modelsLoading || readString(MODEL_KEY)) return;
    if (defaultModel && defaultModel !== draftModel && models.some((item) => item.id === defaultModel)) {
      setDraftModel(defaultModel);
    }
  }, [defaultModel, draftModel, models, modelsLoading]);

  useEffect(() => {
    if (!isMobile) setMobileSidebar(false);
  }, [isMobile]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSidebar(false);
        if (isMobile) setInfoOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      persistConversations(conversationsRef.current, activeIdRef.current);
    };
  }, []);

  const model = active?.model ?? draftModel;
  const modelInfo = models.find((m) => m.id === model);
  const modelName = modelInfo?.name ?? friendlyModelName(model, models);
  const visionEnabled = Boolean(modelInfo?.vision);
  const shareUrl = activeId && origin ? `${origin}/c/${activeId}` : origin;
  const storageBytes = useMemo(() => estimateConversationBytes(conversations), [conversations]);
  const streaming = Boolean(streamingId);

  const runStream = useCallback(
    async (conversation: Conversation, assistantId: string, startedAt: number) => {
      const context = buildContext(
        conversation.messages.filter((message) => message.id !== assistantId),
      );
      const controller = new AbortController();
      abortRef.current = controller;
      setStreamingId(assistantId);

      let content = "";
      let reasoning = "";
      let usage: Message["usage"];
      let failure: string | null = null;
      let finished = false;
      let frame = 0;
      let dirty = false;

      const flush = () => {
        frame = 0;
        if (!dirty) return;
        dirty = false;
        if (!mountedRef.current) return;
        update(conversation.id, (current) => ({
          ...current,
          updatedAt: Date.now(),
          messages: current.messages.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content,
                  reasoning: reasoning || undefined,
                  status: "streaming",
                }
              : message,
          ),
        }));
      };

      const schedule = () => {
        dirty = true;
        if (!frame) frame = window.requestAnimationFrame(flush);
      };

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: conversation.model,
            conversationId: conversation.id,
            messages: context.messages.map((message) => ({
              role: message.role,
              content: message.content,
              attachments: message.attachments?.map((attachment) => ({
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                kind: attachment.kind,
                content: attachment.content,
              })),
            })),
          }),
        });

        if (!response.ok || !response.body) {
          let detail = "";
          try {
            const payload = await response.json();
            detail = payload?.error ?? "";
          } catch {
            detail = await response.text().catch(() => "");
          }
          throw new Error(detail || `Request failed with status ${response.status}.`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            let event: any;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }
            if (event.type === "reasoning" && typeof event.delta === "string") {
              reasoning += event.delta;
              schedule();
            } else if (event.type === "content" && typeof event.delta === "string") {
              content += event.delta;
              schedule();
            } else if (event.type === "done") {
              usage = event.usage;
              finished = true;
            } else if (event.type === "notice" && typeof event.message === "string") {
              notify(event.message, "info");
            } else if (event.type === "error" && typeof event.message === "string") {
              failure = event.message;
            }
          }
        }

        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        dirty = false;
        if (!mountedRef.current) return;

        if (failure) {
          update(conversation.id, (current) => ({
            ...current,
            updatedAt: Date.now(),
            messages: current.messages.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content,
                    reasoning: reasoning || undefined,
                    status: "error",
                    error: failure ?? "The response failed.",
                    durationMs: Date.now() - startedAt,
                  }
                : message,
            ),
          }));
          notify("The response failed. Try regenerating.", "error");
        } else {
          update(conversation.id, (current) => ({
            ...current,
            updatedAt: Date.now(),
            messages: current.messages.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content,
                    reasoning: reasoning || undefined,
                    status: "done",
                    usage,
                    durationMs: Date.now() - startedAt,
                  }
                : message,
            ),
          }));
          if (!finished && !content && !reasoning) {
            notify("The stream ended without content. Try again.", "error");
          }
        }
      } catch (error) {
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        if (!mountedRef.current) return;
        const aborted = controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError");
        if (aborted) {
          update(conversation.id, (current) => ({
            ...current,
            updatedAt: Date.now(),
            messages: current.messages.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content,
                    reasoning: reasoning || undefined,
                    status: "stopped",
                    durationMs: Date.now() - startedAt,
                  }
                : message,
            ),
          }));
        } else {
          const message = error instanceof Error ? error.message : "The response failed.";
          update(conversation.id, (current) => ({
            ...current,
            updatedAt: Date.now(),
            messages: current.messages.map((item) =>
              item.id === assistantId
                ? {
                    ...item,
                    content,
                    reasoning: reasoning || undefined,
                    status: "error",
                    error: message,
                    durationMs: Date.now() - startedAt,
                  }
                : item,
            ),
          }));
          notify(message, "error");
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        if (mountedRef.current) setStreamingId(null);
      }
    },
    [notify, update],
  );

  const sendMessage = useCallback(
    (text: string, attachments: Attachment[]) => {
      if (streamingId) return;
      const chosenModel = active?.model ?? draftModel;
      let conversation = active;

      if (!conversation) {
        conversation = create(chosenModel);
        setActiveId(conversation.id);
        activeIdRef.current = conversation.id;
        try {
          window.history.replaceState(null, "", `/c/${conversation.id}`);
        } catch {
          /* history is best-effort */
        }
      }

      const userMessage = createMessage("user", text.trim());
      userMessage.attachments = attachments.length ? attachments : undefined;
      const assistantMessage = createMessage("assistant");
      assistantMessage.model = chosenModel;
      const now = Date.now();
      const shouldTitle =
        conversation.messages.length === 0 || conversation.title === "New conversation";
      const titleSource = text.trim() || attachments[0]?.name || "New conversation";

      const nextConversation: Conversation = {
        ...conversation,
        title: shouldTitle ? deriveTitle(titleSource) : conversation.title,
        model: chosenModel,
        updatedAt: now,
        messages: [...conversation.messages, userMessage, assistantMessage],
      };

      update(conversation.id, () => nextConversation);
      setMobileSidebar(false);
      void runStream(nextConversation, assistantMessage.id, now);
    },
    [active, create, draftModel, runStream, streamingId, update],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const regenerate = useCallback(
    (assistantId: string) => {
      if (!active || streamingId) return;
      const index = active.messages.findIndex((message) => message.id === assistantId);
      if (index === -1) return;
      let userIndex = -1;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (active.messages[i].role === "user") {
          userIndex = i;
          break;
        }
      }
      if (userIndex === -1) return;
      const assistantMessage = createMessage("assistant");
      assistantMessage.model = active.model;
      const now = Date.now();
      const nextConversation: Conversation = {
        ...active,
        updatedAt: now,
        messages: [...active.messages.slice(0, userIndex + 1), assistantMessage],
      };
      update(active.id, () => nextConversation);
      void runStream(nextConversation, assistantMessage.id, now);
    },
    [active, runStream, streamingId, update],
  );

  const handleModelChange = useCallback(
    (id: string) => {
      setDraftModel(id);
      writeString(MODEL_KEY, id);
      if (active) update(active.id, { model: id });
    },
    [active, update],
  );

  const copyShareLink = useCallback(async () => {
    const url = activeId && origin ? `${origin}/c/${activeId}` : `${origin}/new`;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      notify("Conversation link copied.", "success");
    } catch {
      notify("Could not access the clipboard.", "error");
    }
  }, [activeId, notify, origin]);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    setMobileSidebar(false);
    setInfoOpen(false);
    if (conversationId) {
      router.push("/new");
    } else {
      setActiveId(null);
      window.history.replaceState(null, "", "/new");
    }
  }, [conversationId, router]);

  const handleSelect = useCallback(
    (id: string) => {
      setMobileSidebar(false);
      if (id === activeId) return;
      router.push(`/c/${id}`);
    },
    [activeId, router],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (id === activeId) {
        abortRef.current?.abort();
        remove(id);
        setActiveId(null);
        setInfoOpen(false);
        router.push("/new");
      } else {
        remove(id);
      }
      notify("Conversation deleted.", "success");
    },
    [activeId, notify, remove, router],
  );

  const handleClearAll = useCallback(() => {
    abortRef.current?.abort();
    clearAll();
    setActiveId(null);
    setInfoOpen(false);
    router.push("/new");
    notify("All local conversations cleared.", "success");
  }, [clearAll, notify, router]);

  const requestDelete = useCallback((id: string) => {
    const target = conversations.find((conversation) => conversation.id === id);
    setDeleteTarget({ id, title: target?.title ?? "this conversation" });
  }, [conversations]);

  const messages = active?.messages ?? [];
  const hasMessages = messages.length > 0;
  const readyToUse = ready;

  return (
    <div
      className="workspace"
      data-info={infoOpen ? "open" : "closed"}
      data-focus={focusMode ? "true" : "false"}
      data-sidebar={mobileSidebar ? "open" : "closed"}
    >
      <button
        type="button"
        className="drawer-scrim sidebar-scrim"
        aria-label="Close sidebar"
        onClick={() => setMobileSidebar(false)}
      />
      <div className="sidebar-shell">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          ready={ready}
          storageBytes={storageBytes}
          attachmentBytes={totalAttachmentBytes}
          onNew={handleNewChat}
          onSelect={handleSelect}
          onRename={rename}
          onDelete={requestDelete}
          onTogglePin={togglePin}
          onClose={() => setMobileSidebar(false)}
          showClose={isMobile}
        />
      </div>

      <main className="chat-main">
        <ChatHeader
          title={active?.title ?? "New conversation"}
          onRename={(title) => (active ? rename(active.id, title) : undefined)}
          onMenu={() => {
            setInfoOpen(false);
            setMobileSidebar((prev) => !prev);
          }}
          onToggleInfo={() => {
            setMobileSidebar(false);
            setInfoOpen((prev) => !prev);
          }}
          onToggleFocus={() => setFocusMode((prev) => !prev)}
          onCopyLink={copyShareLink}
          infoOpen={infoOpen}
          focusMode={focusMode}
          streaming={streaming}
          models={models}
          model={model}
          onModelChange={handleModelChange}
          mode={mode}
        />

        <div className="chat-body">
          {!readyToUse ? (
            <div className="workspace-loading">
              <span className="loading-orb" />
              <p>Waking up your workspace…</p>
            </div>
          ) : hasMessages ? (
            <MessageList
              messages={messages}
              streamingId={streamingId}
              prefs={prefs}
              modelLabel={modelName}
              onRetry={regenerate}
            />
          ) : (
            <EmptyState
              onPrompt={(prompt) => sendMessage(prompt, [])}
              modelName={modelName}
              mode={mode}
            />
          )}
        </div>

        <Composer
          onSend={sendMessage}
          onStop={stopStreaming}
          streaming={streaming}
          ready={readyToUse}
          visionEnabled={visionEnabled}
          modelName={modelName}
          mode={mode}
        />
      </main>

      <button
        type="button"
        className="drawer-scrim info-scrim"
        aria-label="Close info panel"
        onClick={() => setInfoOpen(false)}
      />
      <div className="info-shell">
        <InfoPanel
          conversation={active}
          models={models}
          mode={mode}
          prefs={prefs}
          onPrefsChange={(patch) => setPrefs((prev) => ({ ...prev, ...patch }))}
          shareUrl={activeId ? shareUrl : ""}
          storageBytes={storageBytes}
          attachmentBytes={totalAttachmentBytes}
          conversationCount={conversations.length}
          onClose={() => setInfoOpen(false)}
          onClearAll={handleClearAll}
          onDeleteConversation={() => {
            if (active) handleDeleteConversation(active.id);
          }}
        />
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete conversation?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from this browser. Export it first if you need a copy.`
            : undefined
        }
        tone="danger"
        size="sm"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (deleteTarget) handleDeleteConversation(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </button>
          </>
        }
      />

      <span className="sr-only" aria-live="polite">
        {streaming ? "Aurora is responding." : hasMessages ? "Response finished." : ""}
      </span>
    </div>
  );
}
