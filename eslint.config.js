import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "build", "coverage", "node_modules", "*.config.js", "*.config.ts", "supabase/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "no-restricted-globals": [
        "error",
        { name: "parseInt", message: "Use safeParseInt de '@/lib/safe-number' — parseInt retorna NaN silenciosamente." },
        { name: "parseFloat", message: "Use safeParseFloat de '@/lib/safe-number' — parseFloat retorna NaN silenciosamente." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='Number'][property.name=/^(parseInt|parseFloat)$/]",
          message: "Use safeParseInt/safeParseFloat de '@/lib/safe-number' em vez de Number.parseInt/parseFloat.",
        },
      ],
    },
  },
  {
    files: ["src/lib/safe-number.ts", "src/lib/__tests__/**", "src/hooks/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-globals": "off",
      "no-restricted-syntax": "off",
    },
  },
);
