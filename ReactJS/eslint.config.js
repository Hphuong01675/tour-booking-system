import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    { ignores: ["dist"] },
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                sourceType: "module",
            },
        },
        settings: {
            react: { version: "detect" }, // Tự động nhận diện React 19
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            // Các rules cơ bản
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...react.configs["jsx-runtime"].rules, // Quan trọng cho React 17+
            ...reactHooks.configs.recommended.rules,

            // Tùy chỉnh thêm
            "react/jsx-no-target-blank": "off",
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
        },
    },
];
