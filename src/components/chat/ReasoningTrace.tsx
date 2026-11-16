"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrainIcon, ChevronDownIcon } from "@/components/ui/icons";

interface ReasoningTraceProps {
  reasoning: string;
  streaming: boolean;
  contentStarted: boolean;
  durationMs?: number;
}

export default function ReasoningTrace({
  reasoning,
  streaming,
  contentStarted,
  durationMs,
}: ReasoningTraceProps) {
  const [open, setOpen] = useState(true);
  const [manual, setManual] = useState(false);
  const autoCollapsed = useRef(false);

  useEffect(() => {
    if (streaming && contentStarted && !autoCollapsed.current && !manual) {
      autoCollapsed.current = true;
      setOpen(false);
    }
  }, [streaming, contentStarted, manual]);

  useEffect(() => {
    if (streaming && !contentStarted) setOpen(true);
  }, [streaming, contentStarted]);

  if (!reasoning.trim()) return null;

  const toggle = () => {
    setManual(true);
    setOpen((prev) => !prev);
  };

  const seconds = durationMs && durationMs > 0 ? Math.max(1, Math.round(durationMs / 1000)) : null;
  const label = streaming && !contentStarted ? "Thinking" : "Reasoning trace";
  const meta = streaming
    ? contentStarted
      ? "streaming"
      : "reading the prompt"
    : seconds
      ? `${seconds}s`
      : `${reasoning.length.toLocaleString("en-US")} chars`;

  return (
    <section className={`reasoning${open ? " is-open" : ""}${streaming && !contentStarted ? " is-thinking" : ""}`}>
      <button
        type="button"
        className="reasoning-head"
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="reasoning-icon">
          <BrainIcon size={16} />
        </span>
        <span className="reasoning-title">
          {label}
          {streaming && !contentStarted ? (
            <span className="thinking-dots" aria-hidden="true">
              <i /><i /><i />
            </span>
          ) : null}
        </span>
        <span className="reasoning-meta">{meta}</span>
        <ChevronDownIcon size={14} className="reasoning-chevron" />
      </button>
      <div className="reasoning-body-wrap" aria-hidden={!open}>
        <div className="reasoning-body">
          {reasoning}
          {streaming && !contentStarted ? <span className="reasoning-caret" aria-hidden="true" /> : null}
        </div>
      </div>
    </section>
  );
}
