import { createRoot } from "react-dom/client";
import { initToolbar } from "@21st-extension/toolbar";
import App from "./App.tsx";
import "./index.css";

const stagewiseConfig = {
  plugins: [],
};

function setupStagewise() {
  if (import.meta.env.DEV) {
    initToolbar(stagewiseConfig);
  }
}

setupStagewise();

createRoot(document.getElementById("root")!).render(<App />);
