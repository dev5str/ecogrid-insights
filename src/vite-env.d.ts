/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for Ollama when not using the dev proxy (e.g. http://127.0.0.1:11434). */
  readonly VITE_OLLAMA_URL?: string;
  /** Ollama model tag; default in code is llava. */
  readonly VITE_OLLAMA_MODEL?: string;
}
