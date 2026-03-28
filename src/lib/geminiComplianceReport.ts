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
import { resolveOllamaChatUrl } from "@/lib/ollamaEndpointSettings";

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
  const url = resolveOllamaChatUrl();

  const res = await fetch(url, {
    method: "POST",
    headers: headersForOllamaRequest(url),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        temperature: 0.35,
        num_predict: 4096,
      },
    }),
  });

  const raw = (await res.json()) as OllamaChatResponse & { message?: { content?: string } };

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
