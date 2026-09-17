import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(), // 👇 2. Khai báo plugin vào mảng
    nodePolyfills({
      // Tự động polyfill các module bị thiếu (như stream, buffer...)
      include: ["stream", "util", "buffer"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    port: 5171, // <--- cố định port
    strictPort: true, // <--- nếu port bị chiếm → KHÔNG tự đổi
    proxy: {
      "/api": {
        target: "http://localhost:7012",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
