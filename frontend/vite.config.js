import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: "../stayops/public/frontend",
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: "assets/index.js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: function (assetInfo) {
                    if (assetInfo.name === "index.css") {
                        return "assets/index.css";
                    }
                    return "assets/[name][extname]";
                },
            },
        },
    },
    server: {
        port: 8080,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:8703",
                changeOrigin: true,
            },
        },
    },
});
