"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ModelInfo } from "@/lib/types";
import { friendlyModelName } from "@/lib/chat";
import { CheckIcon, ChevronDownIcon, SearchIcon, SparklesIcon, ZapIcon } from "@/components/ui/icons";

interface ModelPickerProps {
  models: ModelInfo[];
  value: string;
  onChange: (id: string) => void;
  mode: "live" | "demo";
  align?: "left" | "right";
}

export default function ModelPicker({ models, value, onChange, mode, align = "left" }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(q) ||
        model.id.toLowerCase().includes(q) ||
        model.vendor.toLowerCase().includes(q),
    );
  }, [models, query]);

  const selected = models.find((model) => model.id === value);
  const label = selected?.name ?? friendlyModelName(value, models);

  return (
    <div className="model-picker" ref={rootRef}>
      <button
        type="button"
        className={`model-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Choose a model"
      >
        <span className="model-trigger-icon">
          <SparklesIcon size={14} />
        </span>
        <span className="model-trigger-text">
          <span className="model-trigger-name">{label}</span>
          <span className="model-trigger-meta">
            {selected?.reasoning ? "Reasoning" : selected?.vision ? "Vision" : mode === "live" ? "Live" : "Demo"}
          </span>
        </span>
        <ChevronDownIcon size={14} className="model-chevron" />
      </button>

      {open ? (
        <div className={`model-menu${align === "right" ? " align-right" : ""}`} role="listbox">
          <div className="model-menu-head">
            <span className="model-menu-title">
              <ZapIcon size={14} /> Free models
            </span>
            <span className={`mode-badge mode-${mode}`}>{mode === "live" ? "LiteRouter" : "Demo"}</span>
          </div>
          <div className="model-search">
            <SearchIcon size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter models"
              aria-label="Filter models"
              autoFocus
            />
          </div>
          <div className="model-list">
            {filtered.length === 0 ? <p className="model-empty">No matching model.</p> : null}
            {filtered.map((model) => (
              <button
                type="button"
                key={model.id}
                className={`model-item${model.id === value ? " is-active" : ""}`}
                onClick={() => {
                  onChange(model.id);
                  setOpen(false);
                }}
                role="option"
                aria-selected={model.id === value}
              >
                <span className="model-item-main">
                  <span className="model-item-name">
                    {model.name}
                    {model.recommended ? <span className="model-rec">Recommended</span> : null}
                  </span>
                  <span className="model-item-sub">
                    {model.vendor}
                    {model.context ? ` · ${Math.round(model.context / 1000)}k context` : ""}
                  </span>
                </span>
                <span className="model-item-flags">
                  {model.vision ? <span className="flag flag-vision">Vision</span> : null}
                  {model.reasoning ? <span className="flag flag-reason">Reasoning</span> : null}
                  {model.id === value ? <CheckIcon size={15} className="model-check" /> : null}
                </span>
              </button>
            ))}
          </div>
          <p className="model-foot">
            Free models share a daily allowance. Reasoning appears in a collapsible trace.
          </p>
        </div>
      ) : null}
    </div>
  );
}
