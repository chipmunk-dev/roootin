import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { APP_NAME, APP_THEME_COLOR } from "./src/config/app";

export default defineConfig({
  plugins: [
    {
      name: "focusflow-app-name",
      transformIndexHtml: (html) => html.replaceAll("%APP_NAME%", APP_NAME)
    },
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["focusflow-icon.svg"],
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: "계획된 학습과 빠른 집중 복귀를 위한 로컬 우선 Study PWA",
        theme_color: APP_THEME_COLOR,
        background_color: "#f4f3ed",
        display: "standalone",
        start_url: "/today",
        scope: "/",
        lang: "ko",
        icons: [
          {
            src: "/focusflow-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"]
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true
  }
});
