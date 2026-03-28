import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage } from "node:http";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer | string) => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
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
    plugins: [react(), ollamaDevProxy()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});
