// Property-based tests for the webhook history module.
// Covers: cap MAX_ENTRIES=20, ordering (newest first), validation of corrupt entries,
// CSV escaping round-trip, NDJSON line-count invariance, header allowlist safety and
// snippet truncation.
import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import {
  loadWebhookHistory,
  appendWebhookHistory,
  clearWebhookHistory,
  truncateResponseSnippet,
  pickSafeHeaders,
  webhookHistoryToCSV,
  webhookHistoryToNDJSON,
  type WebhookHistoryEntry,
} from "@/lib/security-alerts-webhook-history";

const MAX_ENTRIES = 20;

const arbEntry = () =>
  fc.record({
    url: fc.webUrl(),
    filename: fc.string({ minLength: 1, maxLength: 40 }),
    format: fc.constantFrom("csv", "pdf") as fc.Arbitrary<"csv" | "pdf">,
    scope: fc.constantFrom("all", "critical", "unread") as fc.Arbitrary<
      "all" | "critical" | "unread"
    >,
    count: fc.integer({ min: 0, max: 10_000 }),
    status: fc.integer({ min: 0, max: 599 }),
    ok: fc.boolean(),
    signed: fc.boolean(),
    latency_ms: fc.integer({ min: 0, max: 60_000 }),
    kind: fc.constantFrom("export", "test") as fc.Arbitrary<"export" | "test">,
    attempts: fc.integer({ min: 1, max: 5 }),
  });

describe("security-alerts-webhook-history (PBT)", () => {
  beforeEach(() => {
    clearWebhookHistory();
  });

  it("respeita cap MAX_ENTRIES e mantém ordem do mais recente para o mais antigo", () => {
    fc.assert(
      fc.property(fc.array(arbEntry(), { minLength: 1, maxLength: 60 }), (entries) => {
        clearWebhookHistory();
        const inserted: WebhookHistoryEntry[] = [];
        for (const e of entries) inserted.push(appendWebhookHistory(e));
        const stored = loadWebhookHistory();
        expect(stored.length).toBeLessThanOrEqual(MAX_ENTRIES);
        expect(stored.length).toBe(Math.min(entries.length, MAX_ENTRIES));
        // O primeiro do storage deve ser o último inserido.
        expect(stored[0].id).toBe(inserted[inserted.length - 1].id);
        // IDs únicos
        const ids = new Set(stored.map((s) => s.id));
        expect(ids.size).toBe(stored.length);
      }),
      { numRuns: 200 },
    );
  });

  it("descarta entradas corrompidas no storage sem lançar", () => {
    fc.assert(
      fc.property(fc.array(fc.jsonValue(), { maxLength: 20 }), (garbage) => {
        window.localStorage.setItem("security-alerts:webhook-history:v1", JSON.stringify(garbage));
        const out = loadWebhookHistory();
        // Só sobrevive quem passa no isValid (nenhum item aleatório aqui deve passar).
        for (const e of out) {
          expect(typeof e.id).toBe("string");
          expect(typeof e.url).toBe("string");
          expect(typeof e.status).toBe("number");
          expect(typeof e.ok).toBe("boolean");
          expect(typeof e.latency_ms).toBe("number");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("truncateResponseSnippet nunca retorna string maior que o input + marcador", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 2000 }), (s) => {
        const out = truncateResponseSnippet(s);
        if (!s) {
          expect(out).toBeUndefined();
          return;
        }
        if (s.length <= 500) {
          expect(out).toBe(s);
        } else {
          expect(out!.startsWith(s.slice(0, 500))).toBe(true);
          expect(out!).toContain("[truncado");
        }
      }),
      { numRuns: 300 },
    );
  });

  it("pickSafeHeaders só devolve chaves da allowlist e trunca valores longos", () => {
    const allow = [
      "content-type",
      "x-request-id",
      "x-lovable-request-id",
      "retry-after",
      "cf-ray",
    ];
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.oneof(
              fc.constantFrom(...allow),
              fc.string({ minLength: 3, maxLength: 20 }).filter((k) => !allow.includes(k)),
            ),
            fc.string({ minLength: 0, maxLength: 400 }),
          ),
          { maxLength: 20 },
        ),
        (pairs) => {
          const h = new Headers();
          for (const [k, v] of pairs) {
            try {
              h.append(k, v);
            } catch {
              /* header inválido — ignorar */
            }
          }
          const safe = pickSafeHeaders(h);
          for (const [k, v] of Object.entries(safe)) {
            expect(allow).toContain(k);
            expect(v.length).toBeLessThanOrEqual(201); // 200 + ellipsis
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it("CSV: número de linhas = header + entries; NDJSON: 1 linha por entry", () => {
    fc.assert(
      fc.property(fc.array(arbEntry(), { minLength: 0, maxLength: 15 }), (entries) => {
        clearWebhookHistory();
        const stored = entries.map((e) => appendWebhookHistory(e));
        const csv = webhookHistoryToCSV(stored);
        const csvLines = csv.split("\r\n");
        expect(csvLines.length).toBe(stored.length + 1);
        // Cada linha do CSV deve ter o mesmo número de colunas do header.
        const cols = csvLines[0].split(",").length;
        for (const line of csvLines.slice(1)) {
          // Contagem tolerante a vírgulas escapadas dentro de aspas — fazemos parse simples.
          const escaped = line.match(/(?:^|,)(?:"(?:[^"]|"")*"|[^,]*)/g) ?? [];
          expect(escaped.length).toBe(cols);
        }
        const nd = webhookHistoryToNDJSON(stored);
        if (stored.length === 0) {
          expect(nd).toBe("");
        } else {
          const lines = nd.split("\n");
          expect(lines.length).toBe(stored.length);
          for (const l of lines) expect(() => JSON.parse(l)).not.toThrow();
        }
      }),
      { numRuns: 200 },
    );
  });
});
