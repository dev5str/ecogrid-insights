/**
 * Drafts NAAC / ISO 14001–style narrative via **local Ollama** (`/api/chat`), default model **llava**.
 *
 * **Endpoint:** Sustainability → Compliance tab can set a **browser-stored** base URL (ngrok / Cloudflare Tunnel) via
 * `ollamaEndpointSettings.ts`; that overrides the dev proxy and `VITE_OLLAMA_URL`.
 *
 * **Development:** default `/api/ollama/api/chat` (Vite proxy → `OLLAMA_HOST` or `http://127.0.0.1:11434`).
 * **Production / preview:** `VITE_OLLAMA_URL` unless overridden in the UI. Set Ollama `OLLAMA_ORIGINS` for CORS.
 *
 * Optional `.env.local`: `VITE_OLLAMA_MODEL=llava`, `OLLAMA_HOST=...` for the dev proxy target.
 */
import {
  getOllamaBaseUrlOverride,
  isValidOllamaBaseUrl,
  resolveOllamaChatUrl,
} from "@/lib/ollamaEndpointSettings";
import { normalizeOllamaBaseUrl } from "@/lib/ollamaForwardShared";

function normalizeEnvValue(raw: string | undefined): string {
  let s = (raw ?? "").trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const OLLAMA_MODEL = normalizeEnvValue(import.meta.env.VITE_OLLAMA_MODEL as string | undefined) || "llava";

export interface GeminiComplianceMetrics {
  institutionName: string;
  reportPeriod: string;
  ecoScoreTopInstitutions: { name: string; area: string; score: number }[];
  carbon: {
    monthlyTonnesCo2e: number;
    nationalBenchmarkTonnes: number;
    driversPct: { electricity: number; water: number; waste: number; air: number };
  };
  electricityAnomaliesSample: { zone: string; loadKw: number; baselineKw: number; rootCauseTag: string }[];
  /** Extra synthetic rows for the model */
  wasteBinsAvgFillPct: number;
  waterFlowLMinAvg: number;
  gridLoadKwAvg: number;
}

function buildPrompt(metrics: GeminiComplianceMetrics): string {
  return `You are an environmental compliance writer for Indian higher-education institutions.

Write a formal **environmental performance and compliance draft** suitable as an annex for NAAC self-study, ISO 14001 evidence, or CSR reporting. Use professional English. Do not invent real regulations - say "indicative" or "draft" where needed.

**Input data (demo / simulated EcoGrid telemetry - treat as sample only):**
${JSON.stringify(metrics, null, 2)}

**Required structure (use these exact section titles as lines starting with ##):**
## Executive summary
## Quantitative snapshot
## Resource & emissions overview
## Observed risks and anomalies
## Recommended actions (next 30–90 days)
## Draft compliance statement
## Data limitations

Rules:
- Reference specific numbers from the JSON where relevant.
- Keep total length under 1400 words.
- Output **plain text only** (no HTML, no markdown code fences, no backticks).
- Use bullet lines starting with "- " where lists help readability.`;
}

type OllamaChatResponse = {
  message?: { role?: string; content?: string };
  error?: string;
};

function headersForOllamaRequest(url: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (/ngrok(-free)?\.(app|dev)/i.test(url)) {
    h["ngrok-skip-browser-warning"] = "69420";
  }
  return h;
}

export async function fetchGeminiComplianceNarrative(metrics: GeminiComplianceMetrics): Promise<string> {
  const prompt = buildPrompt(metrics);
  const chatBody = {
    model: OLLAMA_MODEL,
    messages: [{ role: "user", content: prompt }],
    stream: false,
    options: {
      temperature: 0.35,
      num_predict: 4096,
    },
  };

  const tunnelBase = normalizeOllamaBaseUrl(getOllamaBaseUrlOverride());
  const useForwardProxy = Boolean(tunnelBase && isValidOllamaBaseUrl(tunnelBase));

  let res: Response;
  try {
    if (useForwardProxy) {
      res = await fetch(new URL("/api/ollama-forward", window.location.origin).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: tunnelBase, chat: chatBody }),
      });
    } else {
      const url = resolveOllamaChatUrl();
      res = await fetch(url, {
        method: "POST",
        headers: headersForOllamaRequest(url),
        body: JSON.stringify(chatBody),
      });
    }
  } catch (e) {
    const hint = useForwardProxy
      ? "Tunnel requests use this app’s /api/ollama-forward proxy. On localhost use pnpm dev (not vite preview). On Vercel, deploy with the api/ollama-forward serverless route."
      : "If this is a CORS error, save your ngrok URL in Sustainability → Compliance (uses same-origin proxy) or set OLLAMA_ORIGINS on Ollama.";
    throw new Error(
      `Network error: ${e instanceof Error ? e.message : String(e)}. ${hint}`,
    );
  }

  const responseText = await res.text();
  let raw: OllamaChatResponse & { message?: { content?: string } };
  try {
    raw = JSON.parse(responseText) as OllamaChatResponse & { message?: { content?: string } };
  } catch {
    throw new Error(
      `Ollama returned non-JSON (HTTP ${res.status}): ${responseText.slice(0, 280)}`,
    );
  }

  if (!res.ok) {
    const msg = typeof raw.error === "string" ? raw.error : res.statusText;
    throw new Error(
      `Ollama (${OLLAMA_MODEL}): ${msg}. Pull the model with: ollama pull ${OLLAMA_MODEL} - ensure Ollama is running (ollama serve).`,
    );
  }

  if (typeof raw.error === "string" && raw.error) {
    throw new Error(
      `Ollama (${OLLAMA_MODEL}): ${raw.error}. Try: ollama pull ${OLLAMA_MODEL}`,
    );
  }

  const text = raw.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error(
      `Ollama returned an empty reply for model "${OLLAMA_MODEL}". Try a text model (e.g. llama3.2) via VITE_OLLAMA_MODEL if llava struggles with long text-only prompts.`,
    );
  }

  return text;
}
