import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Sitemap from "vite-plugin-sitemap";

export default defineConfig({
    plugins: [react(), Sitemap({ hostname: "https://tomp2.github.io/minecolonies-style-explorer/" })],
    base: process.env.NODE_ENV === "production" ? "/minecolonies-style-explorer/" : "/",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
