import js from "@eslint/js";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Regras de projeto compartilhadas pelo front (src/) e pelos arquivos que o CI executa
// de fato (configs de build e scripts/). Ficam em um objeto só para que ampliar o escopo
// não signifique copiar a lista de regras — a cópia foi o que deixou `vite.config.ts`,
// `vitest.config.ts`, `playwright.config.ts` e `scripts/**` fora do gate até a etapa 264.
const sharedRules = {
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unused-vars": [
    "warn",
    // _-prefixado é descarte intencional (convenção já usada em args); sem varsIgnorePattern
    // o eslint acusa variáveis e destructuring que o autor marcou como descartadas de propósito.
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
  ],
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
};

// Acessibilidade — etapa 264 (achados A-123/A-046). Ficam em `warn` enquanto houver
// ocorrência; viram `error` quando a contagem zerar, como o plano pede.
const a11yRules = {
  "jsx-a11y/control-has-associated-label": "warn",
  "jsx-a11y/alt-text": "warn",
  "jsx-a11y/label-has-associated-control": "warn",
};

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      "coverage",
      "node_modules",
      // supabase/** fica fora de propósito: cada edge function tem `deno check` e o guard
      // scripts/guard-edge-numeric.mjs cobre o que o ESLint cobria aqui.
      "supabase/**",
    ],
  },
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
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...sharedRules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      ...a11yRules,
    },
  },
  {
    // Arquivos que o build/CI executam e que ficavam fora do gate: configs de Vite, Vitest
    // e Playwright e os scripts de guarda/manutenção. Quando são .ts também casam no bloco
    // acima; este vem depois de propósito, para valer `globals.node` e `no-console` desligado.
    files: ["*.config.{js,ts}", "scripts/**/*.{js,mjs,ts}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      ...sharedRules,
      // scripts/ são CLIs: imprimir o resultado é a saída deles.
      "no-console": "off",
    },
  },
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "jsx-a11y/control-has-associated-label": "off",
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/label-has-associated-control": "off",
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