import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage } from "node:http";
import {
  isAllowedOllamaForwardBase,
  normalizeOllamaBaseUrl,
  type OllamaForwardRequestBody,
} from "./src/lib/ollamaForwardShared";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer | string) => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Dev-only: same-origin `/api/ollama-forward` → user tunnel / remote Ollama (avoids browser CORS to ngrok). */
function ollamaForwardDevProxy(): Plugin {
  return {
    name: "ollama-forward-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (pathname !== "/api/ollama-forward") return next();

        const cors = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        };

        if (req.method === "OPTIONS") {
          res.writeHead(204, cors);
          res.end();
          return;
        }
        if (req.method !== "POST") return next();

        try {
          const raw = await readBody(req);
          const body = JSON.parse(raw.toString() || "{}") as OllamaForwardRequestBody;
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
          res.end(
            JSON.stringify({
              error: e instanceof Error ? e.message : "Ollama forward failed",
            }),
          );
        }
      });
    },
  };
}

/** Dev-only: forward `/api/ollama/*` → Ollama (default `http://127.0.0.1:11434`) to avoid browser CORS. */
function ollamaDevProxy(): Plugin {
  return {
    name: "ollama-dev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (!pathname.startsWith("/api/ollama/")) return next();
        if (req.method !== "POST") return next();

        const env = loadEnv(server.config.mode, rootDir, "");
        const ollamaHost = (env.OLLAMA_HOST || env.VITE_OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
        const targetPath = pathname.replace(/^\/api\/ollama/, "");
        const targetUrl = `${ollamaHost}${targetPath}`;

        try {
          const bodyBuf = await readBody(req);
          const upstream = await fetch(targetUrl, {
            method: "POST",
            headers: {
              "Content-Type": req.headers["content-type"] ?? "application/json",
            },
            body: bodyBuf.length ? bodyBuf : undefined,
          });
          const text = await upstream.text();
          res.statusCode = upstream.status;
          const ct = upstream.headers.get("content-type");
          if (ct) res.setHeader("Content-Type", ct);
          res.end(text);
        } catch (e) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                e instanceof Error
                  ? `${e.message}. Is Ollama running? Try: ollama serve`
                  : "Ollama proxy request failed",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    envDir: rootDir,
    define: {
      "import.meta.env.VITE_OLLAMA_URL": JSON.stringify(env.VITE_OLLAMA_URL ?? ""),
      "import.meta.env.VITE_OLLAMA_MODEL": JSON.stringify(env.VITE_OLLAMA_MODEL ?? ""),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), ollamaForwardDevProxy(), ollamaDevProxy()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});
