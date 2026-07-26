/**
 * PBT do guard `scripts/guard-edge-numeric.mjs`.
 *
 * Simula centenas de fixtures sintéticas de edge functions para provar:
 *  - R1 (z.number() sem .finite()) é detectado independentemente de espaços,
 *    quebras de linha, encadeamentos e comentários.
 *  - R1 NÃO é disparado quando `.finite()` está encadeado (mesmo com whitespace).
 *  - R2 detecta Number(...), parseInt(...), parseFloat(...) e formas Number.parseX.
 *  - R2 respeita allowlist (Number.isFinite, Number.MAX_SAFE_INTEGER, etc.).
 *  - R2 respeita o idioma seguro `Number(<expr>.toFixed(<n>))`.
 *  - R2 respeita supressão inline `// safe-numeric-ok`.
 *  - Ocorrências dentro de comentários e strings são ignoradas.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fc from "fast-check";

const GUARD = join(process.cwd(), "scripts/guard-edge-numeric.mjs");

function runGuard(dir: string): { code: number; out: string } {
  try {
    const out = execSync(`node ${GUARD} --check`, {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: Buffer; stderr?: Buffer };
    return {
      code: err.status ?? 1,
      out: `${err.stdout?.toString() ?? ""}${err.stderr?.toString() ?? ""}`,
    };
  }
}

/** Materializa uma única edge function sintética em `<root>/supabase/functions/<name>/index.ts`. */
function scaffold(name: string, body: string) {
  const root = mkdtempSync(join(tmpdir(), "guard-edge-"));
  const dir = join(root, "supabase", "functions", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.ts"), body, "utf8");
  return { root, dir };
}

const WS = fc.stringMatching(/^[ \t\n]{0,4}$/);

// PBT com I/O de repositório: sob carga da suíte completa o default de 10s
// é insuficiente. Timeout explícito evita flakiness sem mascarar regressões.
vi.setConfig({ testTimeout: 120_000 });

describe("guard-edge-numeric — Regra 1 (z.number sem .finite)", () => {
  it("detecta z.number() em qualquer disposição de whitespace", () => {
    fc.assert(
      fc.property(WS, WS, WS, (a, b, c) => {
        const body = `import { z } from 'zod';\nconst S = z${a}.${b}number${c}();\n`;
        const { root } = scaffold("f-r1", body);
        try {
          const { code, out } = runGuard(root);
          expect(code).toBe(1);
          expect(out).toMatch(/\[R1\]/);
        } finally {
          rmSync(root, { recursive: true, force: true });
        }
      }),
      { numRuns: 60 },
    );
  });

  it("aceita z.number().finite() com whitespace variável", () => {
    fc.assert(
      fc.property(WS, WS, (a, b) => {
        const body = `import { z } from 'zod';\nconst S = z.number()${a}.${b}finite();\n`;
        const { root } = scaffold("f-r1-ok", body);
        try {
          const { code } = runGuard(root);
          expect(code).toBe(0);
        } finally {
          rmSync(root, { recursive: true, force: true });
        }
      }),
      { numRuns: 60 },
    );
  });

  it("ignora z.number() dentro de comentários e strings", () => {
    const bodies = [
      `// const S = z.number();\nexport default 1;`,
      `/* z.number() */\nexport default 1;`,
      `const s = "z.number()"; export default s;`,
      "const s = `z.number()`; export default s;",
    ];
    for (const body of bodies) {
      const { root } = scaffold("f-r1-noise", body);
      try {
        expect(runGuard(root).code).toBe(0);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });
});

describe("guard-edge-numeric — Regra 2 (coerção insegura)", () => {
  const unsafeForms = [
    "const n = Number(input);",
    "const n = parseInt(input, 10);",
    "const n = parseFloat(input);",
    "const n = Number.parseInt(input, 10);",
    "const n = Number.parseFloat(input);",
  ];

  it.each(unsafeForms)("detecta forma insegura: %s", (form) => {
    const { root } = scaffold("f-r2", `const input='1';\n${form}\n`);
    try {
      const { code, out } = runGuard(root);
      expect(code).toBe(1);
      expect(out).toMatch(/\[R2\]/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  const allow = [
    "if (Number.isFinite(x)) {}",
    "const m = Number.MAX_SAFE_INTEGER;",
    "if (Number.isNaN(x)) {}",
    "const e = Number.EPSILON;",
  ];
  it.each(allow)("respeita allowlist de Number.*: %s", (form) => {
    const { root } = scaffold(
      "f-r2-allow",
      `const x = 1;\n${form}\nexport default x;\n`,
    );
    try {
      expect(runGuard(root).code).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("respeita idioma Number(<expr>.toFixed(<n>))", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 6 }), (digits) => {
        const body = `const x = 1.234;\nconst r = Number(x.toFixed(${digits}));\nexport default r;\n`;
        const { root } = scaffold("f-r2-tofixed", body);
        try {
          expect(runGuard(root).code).toBe(0);
        } finally {
          rmSync(root, { recursive: true, force: true });
        }
      }),
      { numRuns: 30 },
    );
  });

  it("respeita supressão inline `safe-numeric-ok`", () => {
    const body = `const s='1';\nconst n = Number(s); // safe-numeric-ok: fonte confiável\n`;
    const { root } = scaffold("f-r2-suppress", body);
    try {
      expect(runGuard(root).code).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("ignora coerção em comentários e strings", () => {
    const bodies = [
      `// const n = Number(x);\nexport default 1;`,
      `/* parseInt('1',10) */\nexport default 1;`,
      `const s = "parseFloat('1.2')"; export default s;`,
    ];
    for (const body of bodies) {
      const { root } = scaffold("f-r2-noise", body);
      try {
        expect(runGuard(root).code).toBe(0);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });
});

describe("guard-edge-numeric — repositório real", () => {
  it("passa no --check no estado atual do repo", () => {
    const { code } = runGuard(process.cwd());
    expect(code).toBe(0);
  });
});
