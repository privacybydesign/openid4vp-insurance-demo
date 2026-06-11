import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001"

// Vite 6 blocks requests whose Host header isn't in `allowedHosts`. In staging
// the ingress fronts us at e.g. `insurance-demo.openid4vc.staging.yivi.app`,
// so the deployment passes that hostname via VITE_ALLOWED_HOSTS.
const allowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: process.env.HOST ?? "localhost",
    port: Number.parseInt(process.env.PORT ?? "5173", 10),
    allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
})
