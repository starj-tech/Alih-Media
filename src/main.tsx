import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function normalizeToHashUrl() {
  const { pathname, search, hash } = window.location;
  if (pathname !== "/" && !hash) {
    const normalizedPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    window.history.replaceState(null, "", `/#${normalizedPath}${search}`);
  }
}

normalizeToHashUrl();

createRoot(document.getElementById("root")!).render(<App />);
