/**
 * Vercel serverless: same-origin proxy so the browser does not call ngrok/Ollama directly (avoids CORS).
 * Client POSTs { baseUrl, chat } to /api/ollama-forward; this server POSTs to {baseUrl}/api/chat.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

function normalizeOllamaBaseUrl(urlStr: string): string {
  return urlStr.trim().replace(/\/$/, "");
}

function isAllowedOllamaForwardBase(urlStr: string): boolean {
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

type Body = { baseUrl?: string; chat?: unknown };

function readJsonBody(req: IncomingMessage): Promise<Body> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? (JSON.parse(raw) as Body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as const;

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  let body: Body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.writeHead(400, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  if (!body.baseUrl || body.chat === undefined || body.chat === null) {
    res.writeHead(400, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "JSON body must include baseUrl and chat" }));
    return;
  }
  if (!isAllowedOllamaForwardBase(body.baseUrl)) {
    res.writeHead(400, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "baseUrl is not allowed" }));
    return;
  }

  const target = `${normalizeOllamaBaseUrl(body.baseUrl)}/api/chat`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (/ngrok(-free)?\.(app|dev)/i.test(target)) {
    headers["ngrok-skip-browser-warning"] = "69420";
  }

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers,
      body: JSON.stringify(body.chat),
    });
    const text = await upstream.text();
    const ct = upstream.headers.get("content-type") ?? "application/json";
    res.writeHead(upstream.status, { ...cors, "Content-Type": ct });
    res.end(text);
  } catch (e) {
    res.writeHead(502, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : "Forward request failed" }));
  }
}
