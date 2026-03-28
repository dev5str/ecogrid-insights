/** Shared rules for `/api/ollama-forward` (Vite dev + Vercel). Keeps SSRF surface small. */

export function normalizeOllamaBaseUrl(urlStr: string): string {
  return urlStr.trim().replace(/\/$/, "");
}

/**
 * Accepts tunnel bases (ngrok, trycloudflare) and localhost. Rejects non-http(s), paths, and some internal hosts.
 */
export function isAllowedOllamaForwardBase(urlStr: string): boolean {
  const s = normalizeOllamaBaseUrl(urlStr);
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.pathname !== "/" && u.pathname !== "") return false;
    const host = u.hostname.toLowerCase();
    if (host === "metadata.google.internal" || host.endsWith(".internal")) return false;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".ngrok-free.app") || host.endsWith(".ngrok-free.dev")) return true;
    if (host.endsWith(".trycloudflare.com")) return true;
    if (u.protocol === "https:") return true;
    return false;
  } catch {
    return false;
  }
}

export type OllamaForwardChatBody = {
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
  options?: Record<string, unknown>;
};

export type OllamaForwardRequestBody = {
  baseUrl: string;
  chat: OllamaForwardChatBody;
};
