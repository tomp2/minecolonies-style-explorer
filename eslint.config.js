import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    },
    {
        ignores: ["dist/", "tailwind.config.js"],
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    eslintConfigPrettier,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                React: true,
                JSX: true,
            },
        },
        rules: {
            "react/prop-types": "off",
        },
    },
];
