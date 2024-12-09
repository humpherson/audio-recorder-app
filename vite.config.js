import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: "./localhost+3-key.pem", // Path to your generated key
      cert: "./localhost+3.pem", // Path to your generated certificate
    },
    host: true,
    port: 5173,
  },
});
