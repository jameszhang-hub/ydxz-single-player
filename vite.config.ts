import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const repositoryName = env.GITHUB_REPOSITORY?.split("/")[1];
  const base = env.GITHUB_ACTIONS === "true" && repositoryName ? `/${repositoryName}/` : "/";

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["assets/*"],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        manifest: {
          name: "跃动小子：单机复刻版",
          short_name: "跃动小子单机",
          description: "本地运行的概率养成与自动战斗游戏",
          theme_color: "#163f66",
          background_color: "#081b2a",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: ".",
          icons: [
            { src: "assets/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "assets/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
          ]
        }
      })
    ]
  };
});
