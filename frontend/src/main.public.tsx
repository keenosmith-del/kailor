import "./styles/global.css";
import "./styles/layout.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { MotionConfig } from "motion/react";
import { PublicWebsite } from "./PublicWebsite";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <PublicWebsite />
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>,
);
