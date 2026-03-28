const STORAGE_KEY = "ecogrid-ollama-base-url";

function normalize(raw: string): string {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s.replace(/\/$/, "");
}

/** Returns stored base URL only (no `/api/chat`). */
export function getOllamaBaseUrlOverride(): string {
  if (typeof window === "undefined") return "";
  try {
    return normalize(localStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return "";
  }
}

export function setOllamaBaseUrlOverride(url: string): void {
  if (typeof window === "undefined") return;
  const t = normalize(url);
  try {
    if (!t) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* ignore quota */
  }
}

export function clearOllamaBaseUrlOverride(): void {
  setOllamaBaseUrlOverride("");
}

/** Accepts base like `https://abc.ngrok-free.app` or `http://127.0.0.1:11434`. */
export function isValidOllamaBaseUrl(url: string): boolean {
  const t = normalize(url);
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Full chat URL for `fetch`. Override (browser) wins, then dev proxy, then `VITE_OLLAMA_URL`.
 */
export function resolveOllamaChatUrl(): string {
  const override = normalize(getOllamaBaseUrlOverride());
  if (override && isValidOllamaBaseUrl(override)) {
    return `${override}/api/chat`;
  }
  if (import.meta.env.DEV) {
    return "/api/ollama/api/chat";
  }
  const base =
    normalize((import.meta.env.VITE_OLLAMA_URL as string | undefined) ?? "") || "http://127.0.0.1:11434";
  return `${base}/api/chat`;
}

/** Short label for UI (base only, not full chat path). */
export function getOllamaEndpointDisplayBase(): string {
  const override = normalize(getOllamaBaseUrlOverride());
  if (override && isValidOllamaBaseUrl(override)) return override;
  if (import.meta.env.DEV) {
    return "Vite dev proxy → OLLAMA_HOST / http://127.0.0.1:11434";
  }
  const base =
    normalize((import.meta.env.VITE_OLLAMA_URL as string | undefined) ?? "") || "http://127.0.0.1:11434";
  return base;
}
