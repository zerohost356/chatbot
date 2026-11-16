import { FALLBACK_MODEL, MODEL_OPTIONS } from "@/lib/chat";
import type { ModelInfo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIORITY = [
  "deepseek-v4.1-flash:free",
  "deepseek-v4.1-flash-1017:free",
  "deepseek-v4.1-flash-cheap:free",
  "deepseek-v4-flash:free",
  "deepseek-v3.2:free",
  "glm-5.3-flash:free",
  "qwen3-coder-next:free",
  "gpt-oss-120b:free",
  "minimax-m2.7:free",
  "qwen3.8-27b:free",
  "deepseek-v3.1:free",
];

const EXCLUDE = /heretic|roleplay|uncensored|image|embedding|whisper|tts|moderation/i;

interface Cache {
  at: number;
  models: ModelInfo[];
}

let cache: Cache | null = null;
const CACHE_MS = 10 * 60 * 1000;

const CURATED_FALLBACK: ModelInfo[] = [
  ...MODEL_OPTIONS,
  {
    id: "deepseek-v3.2:free",
    name: "DeepSeek V3.2",
    vendor: "DeepSeek · Free",
    description: "Higher-compute reasoning model with a 163k context window.",
    context: 163_840,
    reasoning: true,
    vision: false,
    free: true,
    available: true,
  },
  {
    id: "glm-5.3-flash:free",
    name: "GLM 5.3 Flash",
    vendor: "Z.ai · Free",
    description: "Multimodal flash model with a 1M context window.",
    context: 1_048_576,
    reasoning: true,
    vision: true,
    free: true,
    available: true,
  },
  {
    id: "qwen3-coder-next:free",
    name: "Qwen3 Coder Next",
    vendor: "Qwen · Free",
    description: "Coding-focused model tuned for agentic development.",
    context: 262_144,
    reasoning: false,
    vision: false,
    free: true,
    available: true,
  },
  {
    id: "gpt-oss-120b:free",
    name: "GPT OSS 120B",
    vendor: "OpenAI · Free",
    description: "Open-weight reasoning model with visible chain-of-thought.",
    context: 131_072,
    reasoning: true,
    vision: false,
    free: true,
    available: true,
  },
];

function displayVendor(ownedBy: string | undefined): string {
  if (!ownedBy) return "LiteRouter · Free";
  const pretty = ownedBy
    .replace(/-ai$/, "")
    .replace(/^z-ai$/, "Z.ai")
    .replace(/^openai$/, "OpenAI")
    .replace(/^deepseek$/, "DeepSeek")
    .replace(/^qwen$/, "Qwen")
    .replace(/^meta$/, "Meta")
    .replace(/^mistralai$/, "Mistral")
    .replace(/^minimax$/, "MiniMax")
    .replace(/^google$/, "Google");
  return `${pretty.charAt(0).toUpperCase()}${pretty.slice(1)} · Free`;
}

function toModel(raw: any): ModelInfo | null {
  const id = typeof raw?.id === "string" ? raw.id : "";
  if (!id || !id.endsWith(":free")) return null;
  if (raw?.type && raw.type !== "chat") return null;
  if (EXCLUDE.test(id)) return null;
  if (raw?.endpoints?.chat_completions && raw.endpoints.chat_completions.status !== "supported") {
    return null;
  }
  const capabilities = raw?.capabilities ?? {};
  return {
    id,
    name:
      raw.display_name ||
      id
        .replace(/:free$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase()),
    vendor: displayVendor(raw.owned_by),
    description: typeof raw.description === "string" ? raw.description.slice(0, 220) : undefined,
    context: typeof raw.context_window === "number" ? raw.context_window : undefined,
    reasoning: Boolean(capabilities.reasoning),
    vision: Boolean(capabilities.vision),
    free: true,
    recommended: id === FALLBACK_MODEL.id,
    available: true,
  };
}

function rank(model: ModelInfo): number {
  const index = PRIORITY.indexOf(model.id);
  if (index !== -1) return index;
  if (model.vision) return 40;
  if (model.reasoning) return 60;
  return 100;
}

export async function GET(): Promise<Response> {
  const defaultModel = process.env.LITEROUTER_MODEL || FALLBACK_MODEL.id;
  const key = process.env.LITEROUTER_API_KEY;

  if (!key) {
    return Response.json({
      models: [FALLBACK_MODEL],
      mode: "demo",
      defaultModel: FALLBACK_MODEL.id,
    });
  }

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return Response.json({
      models: cache.models,
      mode: "live",
      defaultModel,
    });
  }

  const baseUrl = (process.env.LITEROUTER_BASE_URL || "https://api.literouter.com/v1").replace(/\/$/, "");

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`models ${res.status}`);
    const json = (await res.json()) as any;
    const rawModels: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
    const mapped = rawModels
      .map(toModel)
      .filter((m): m is ModelInfo => Boolean(m));
    const seen = new Set<string>();
    const models = mapped
      .filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
      .slice(0, 28);

    const withDefault = models.some((m) => m.id === defaultModel)
      ? models
      : [
          {
            ...FALLBACK_MODEL,
            id: defaultModel,
            name: defaultModel.replace(/:free$/, ""),
          },
          ...models,
        ];

    const finalModels = [
      {
        id: "aurora-demo",
        name: "Aurora Demo",
        vendor: "Local · Offline",
        description: "Deterministic local stream — no network keys required.",
        context: 96_000,
        reasoning: true,
        vision: false,
        free: true,
        recommended: false,
        available: true,
      },
      ...withDefault,
    ].map((model) => ({ ...model, recommended: model.id === defaultModel }));

    cache = { at: Date.now(), models: finalModels };
    return Response.json({ models: finalModels, mode: "live", defaultModel });
  } catch {
    const models = [
      {
        id: "aurora-demo",
        name: "Aurora Demo",
        vendor: "Local · Offline",
        description: "Deterministic local stream — no network keys required.",
        context: 96_000,
        reasoning: true,
        vision: false,
        free: true,
        recommended: false,
        available: true,
      },
      ...CURATED_FALLBACK.map((model) => ({
        ...model,
        recommended: model.id === defaultModel,
      })),
    ];
    return Response.json({ models, mode: "live", defaultModel });
  }
}
