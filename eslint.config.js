import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
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
    eslintPluginUnicorn.configs["flat/recommended"],
    {
        rules: {
            "unicorn/better-regex": "warn",
            "unicorn/prevent-abbreviations": "off",
            "unicorn/no-null": "off",
            "unicorn/prefer-global-this": "off",
            "unicorn/filename-case": "off",
        },
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
