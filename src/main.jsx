import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import "./styles.css";

// No StrictMode: its double-mounted effects would create and tear down the WebGL scene twice in dev.
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <Analytics />
  </BrowserRouter>
);
