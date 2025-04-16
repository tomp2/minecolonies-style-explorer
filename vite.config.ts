import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), sentryVitePlugin({
        org: "tomp2",
        project: "minecolonies-building-explorer",
        authToken: process.env.SENTRY_AUTH_TOKEN
    })],
    base: process.env.NODE_ENV === "production" ? "/minecolonies-style-explorer/" : "/",
    build: {
        sourcemap: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
});