/**
 * Calls Google Gemini to draft NAAC / ISO 14001–style narrative from demo metrics.
 *
 * API keys in the frontend are visible to anyone — use only for demos or proxy via your backend in production.
 * Override with VITE_GEMINI_API_KEY in `.env.local` if you rotate the key.
 */
const GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ||
  "AIzaSyDpe-l_kOVdb0sMTvuj8zsLnL_kJZ-gG60";

const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"] as const;

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

Write a formal **environmental performance and compliance draft** suitable as an annex for NAAC self-study, ISO 14001 evidence, or CSR reporting. Use professional English. Do not invent real regulations — say "indicative" or "draft" where needed.

**Input data (demo / simulated EcoGrid telemetry — treat as sample only):**
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

export async function fetchGeminiComplianceNarrative(metrics: GeminiComplianceMetrics): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API key. Set VITE_GEMINI_API_KEY in .env.local.");
  }

  const prompt = buildPrompt(metrics);
  let lastErr = "Unknown error";

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 4096,
        },
      }),
    });

    const data = (await res.json()) as {
      error?: { message?: string };
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    if (!res.ok) {
      lastErr = data.error?.message ?? res.statusText;
      continue;
    }

    const text =
      data.candidates
        ?.flatMap((c) => c.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("") ?? "";

    if (text.trim()) return text.trim();
    lastErr = "Empty model response";
  }

  throw new Error(lastErr);
}
