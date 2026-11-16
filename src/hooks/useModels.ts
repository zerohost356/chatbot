"use client";

import { useEffect, useState } from "react";
import type { ModelInfo } from "@/lib/types";
import { FALLBACK_MODEL } from "@/lib/chat";

export interface ModelsResponse {
  models: ModelInfo[];
  mode: "live" | "demo";
  defaultModel?: string;
}

const FALLBACK: ModelsResponse = {
  models: [FALLBACK_MODEL],
  mode: "demo",
  defaultModel: FALLBACK_MODEL.id,
};

export function useModels() {
  const [data, setData] = useState<ModelsResponse>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const load = async () => {
      try {
        const res = await fetch("/api/models", { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ModelsResponse;
        if (Array.isArray(json.models) && json.models.length) {
          setData({
            models: json.models,
            mode: json.mode === "live" ? "live" : "demo",
            defaultModel: json.defaultModel ?? json.models[0].id,
          });
        }
      } catch {
        /* keep fallback */
      } finally {
        window.clearTimeout(timer);
        setLoading(false);
      }
    };
    load();
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return { ...data, loading };
}
