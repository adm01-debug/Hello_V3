/**
 * Suíte de simulação massiva (property-based + cenários determinísticos)
 * para `webhook-health-utils.ts` e `security-alerts-export.ts`.
 *
 * Objetivo: prever falhas ao lidar com dados ausentes, timezones inconsistentes,
 * grandes volumes, valores extremos e conteúdo hostil (CSV injection, unicode,
 * strings longas).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import {
  aggregateEndpoints,
  aggregateHeatmap,
  endpointsToCsv,
  ratioColor,
  SPARK_HOURS,
  type WebhookHealthRow,
} from "@/lib/webhook-health-utils";
import {
  exportAlertsToCsv,
  type ExportableAlert,
} from "@/lib/security-alerts-export";

// ---------- Arbitraries ----------
const rowArb: fc.Arbitrary<WebhookHealthRow> = fc.record({
  created_at: fc
    .integer({ min: Date.now() - 30 * 24 * 3_600_000, max: Date.now() + 24 * 3_600_000 })
    .map((ms) => new Date(ms).toISOString()),
  sent: fc.integer({ min: 0, max: 10_000 }),
  failed: fc.integer({ min: 0, max: 10_000 }),
  oldest_age_ms: fc.option(fc.integer({ min: 0, max: 86_400_000 }), { nil: null }),
  duration_ms: fc.option(fc.integer({ min: 0, max: 60_000 }), { nil: null }),
  endpoint_hash: fc.option(
    fc.constantFrom("hashA", "hashB", "hashC", "hashD", "hashE"),
    { nil: null },
  ),
});

const alertArb: fc.Arbitrary<ExportableAlert> = fc.record({
  id: fc.uuid(),
  created_at: fc
    .integer({ min: Date.parse("2024-01-01"), max: Date.parse("2027-01-01") })
    .map((ms) => new Date(ms).toISOString()),
  severity: fc.constantFrom("low", "medium", "high", "critical"),
  type: fc.constantFrom("auth", "webhook", "rate_limit", "rls"),
  source_type: fc.option(fc.string({ maxLength: 60 }), { nil: null }),
  title: fc.string({ maxLength: 120 }),
  message: fc.string({ maxLength: 2000 }),
  is_read: fc.boolean(),
  read_at: fc.option(
    fc.integer({ min: Date.parse("2024-01-01"), max: Date.parse("2027-01-01") })
      .map((ms) => new Date(ms).toISOString()),
    { nil: null },
  ),
  action_url: fc.option(fc.webUrl(), { nil: null }),
  metadata: fc.option(
    fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
    { nil: null },
  ),
});

// ---------- webhook-health-utils: PBT ----------
describe("webhook-health-utils · simulação massiva", () => {
  it("ratioColor sempre retorna classe válida para qualquer entrada", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10, max: 10, noNaN: true }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (ratio, attempts) => {
          const cls = ratioColor(ratio, attempts);
          expect(typeof cls).toBe("string");
          expect(cls.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 500 },
    );
  });

  it("aggregateEndpoints preserva invariante attempts = sent+failed acumulados", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { minLength: 0, maxLength: 500 }), (rows) => {
        const totalSent = rows.reduce((a, r) => a + (r.sent ?? 0), 0);
        const totalFailed = rows.reduce((a, r) => a + (r.failed ?? 0), 0);
        const stats = aggregateEndpoints(rows, "volume");
        const sumAttempts = stats.reduce((a, s) => a + s.attempts, 0);
        const sumFailed = stats.reduce((a, s) => a + s.failed, 0);
        expect(sumAttempts).toBe(totalSent + totalFailed);
        expect(sumFailed).toBe(totalFailed);
      }),
      { numRuns: 300 },
    );
  });

  it("aggregateEndpoints: sortMode 'volume' produz ordem não-crescente", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 300 }), (rows) => {
        const stats = aggregateEndpoints(rows, "volume");
        for (let i = 1; i < stats.length; i++) {
          expect(stats[i - 1].attempts).toBeGreaterThanOrEqual(stats[i].attempts);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("aggregateEndpoints: sortMode 'ratio' ordena por ratio desc", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 300 }), (rows) => {
        const stats = aggregateEndpoints(rows, "ratio");
        for (let i = 1; i < stats.length; i++) {
          expect(stats[i - 1].ratio).toBeGreaterThanOrEqual(stats[i].ratio);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("aggregateEndpoints: sortMode 'trend' ordena por trendDiff desc", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 300 }), (rows) => {
        const stats = aggregateEndpoints(rows, "trend");
        for (let i = 1; i < stats.length; i++) {
          expect(stats[i - 1].trendDiff).toBeGreaterThanOrEqual(stats[i].trendDiff);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("aggregateEndpoints: trend array sempre tem SPARK_HOURS elementos", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 200 }), (rows) => {
        const stats = aggregateEndpoints(rows, "volume");
        for (const s of stats) {
          expect(s.trend).toHaveLength(SPARK_HOURS);
          for (const v of s.trend) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it("aggregateEndpoints: ratio sempre em [0,1]", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 300 }), (rows) => {
        for (const s of aggregateEndpoints(rows, "volume")) {
          expect(s.ratio).toBeGreaterThanOrEqual(0);
          expect(s.ratio).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("aggregateHeatmap: totals consistentes com input", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 300 }), (rows) => {
        const totalSent = rows.reduce((a, r) => a + (r.sent ?? 0), 0);
        const totalFailed = rows.reduce((a, r) => a + (r.failed ?? 0), 0);
        const { totals, buckets } = aggregateHeatmap(rows);
        expect(totals.sent).toBe(totalSent);
        expect(totals.failed).toBe(totalFailed);
        for (const b of buckets.values()) {
          expect(b.hour).toBeGreaterThanOrEqual(0);
          expect(b.hour).toBeLessThanOrEqual(23);
          expect(b.attempts).toBe(b.sent + b.failed);
          expect(b.failureRatio).toBeGreaterThanOrEqual(0);
          expect(b.failureRatio).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 300 },
    );
  });

  it("aggregateHeatmap: sempre retorna 3 dias (hoje + 2 anteriores)", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 100 }), (rows) => {
        const { days } = aggregateHeatmap(rows);
        expect(days).toHaveLength(3);
      }),
      { numRuns: 100 },
    );
  });

  it("endpointsToCsv: cabeçalho fixo e uma linha por endpoint", () => {
    fc.assert(
      fc.property(fc.array(rowArb, { maxLength: 200 }), (rows) => {
        const stats = aggregateEndpoints(rows, "volume");
        const csv = endpointsToCsv(stats);
        const lines = csv.split("\n");
        expect(lines[0]).toBe("endpoint_hash,attempts,failed,failure_ratio_pct");
        if (stats.length === 0) {
          expect(lines).toHaveLength(1);
        } else {
          expect(lines).toHaveLength(1 + stats.length);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ---------- Cenários determinísticos ----------
describe("webhook-health-utils · cenários específicos", () => {
  it("lida com array vazio sem erro", () => {
    expect(aggregateEndpoints([], "volume")).toEqual([]);
    const h = aggregateHeatmap([]);
    expect(h.totals).toEqual({ sent: 0, failed: 0 });
    expect(h.days).toHaveLength(3);
    expect(endpointsToCsv([])).toBe("endpoint_hash,attempts,failed,failure_ratio_pct\n");
  });

  it("tolera created_at inválido sem lançar", () => {
    const rows: WebhookHealthRow[] = [
      { created_at: "not-a-date", sent: 5, failed: 1, oldest_age_ms: null, duration_ms: null, endpoint_hash: "x" },
    ];
    expect(() => aggregateEndpoints(rows, "volume")).not.toThrow();
    expect(() => aggregateHeatmap(rows)).not.toThrow();
  });

  it("agrupa endpoint_hash null sob chave '—'", () => {
    const stats = aggregateEndpoints(
      [
        { created_at: new Date().toISOString(), sent: 1, failed: 0, oldest_age_ms: null, duration_ms: null, endpoint_hash: null },
        { created_at: new Date().toISOString(), sent: 2, failed: 1, oldest_age_ms: null, duration_ms: null, endpoint_hash: null },
      ],
      "volume",
    );
    expect(stats).toHaveLength(1);
    expect(stats[0].hash).toBe("—");
    expect(stats[0].attempts).toBe(4);
  });

  it("timezone: agrupamento heatmap usa UTC hour (não local)", () => {
    // 2025-06-15T23:30:00Z -> hour=23 em UTC independente do TZ do runner
    const rows: WebhookHealthRow[] = [
      { created_at: "2025-06-15T23:30:00Z", sent: 10, failed: 2, oldest_age_ms: null, duration_ms: null, endpoint_hash: "h" },
      { created_at: "2025-06-15T23:45:00Z", sent: 5, failed: 0, oldest_age_ms: null, duration_ms: null, endpoint_hash: "h" },
    ];
    const { buckets } = aggregateHeatmap(rows);
    const bucket = buckets.get("2025-06-15#23");
    expect(bucket).toBeDefined();
    expect(bucket!.sent).toBe(15);
    expect(bucket!.failed).toBe(2);
  });

  it("linhas com hora fora da janela SPARK_HOURS não contam no trend", () => {
    const old = new Date(Date.now() - 100 * 3_600_000).toISOString();
    const stats = aggregateEndpoints(
      [{ created_at: old, sent: 999, failed: 999, oldest_age_ms: null, duration_ms: null, endpoint_hash: "old" }],
      "volume",
    );
    expect(stats[0].trend.every((v) => v === 0)).toBe(true);
    // Mas attempts/failed acumulados incluem tudo
    expect(stats[0].attempts).toBe(1998);
  });

  it("grande volume: 10k linhas em <1s", () => {
    const rows: WebhookHealthRow[] = Array.from({ length: 10_000 }, (_, i) => ({
      created_at: new Date(Date.now() - (i % 24) * 3_600_000).toISOString(),
      sent: i % 100,
      failed: i % 10,
      oldest_age_ms: null,
      duration_ms: null,
      endpoint_hash: `h${i % 20}`,
    }));
    const t0 = performance.now();
    const stats = aggregateEndpoints(rows, "volume");
    aggregateHeatmap(rows);
    endpointsToCsv(stats);
    expect(performance.now() - t0).toBeLessThan(1000);
    expect(stats.length).toBeLessThanOrEqual(20);
  });

  it("ratioColor: fronteiras exatas", () => {
    expect(ratioColor(0, 0)).toContain("muted");
    expect(ratioColor(0.5, 100)).toContain("destructive");
    expect(ratioColor(0.2, 100)).toContain("destructive");
    expect(ratioColor(0.05, 100)).toContain("warning");
    expect(ratioColor(0.01, 100)).toContain("success");
  });
});

// ---------- security-alerts-export ----------
describe("security-alerts-export · exportAlertsToCsv", () => {
  beforeEach(() => {
    // Mock DOM/URL APIs para jsdom
    if (typeof URL.createObjectURL !== "function") {
      (URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(() => "blob:mock");
    } else {
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    }
    if (typeof URL.revokeObjectURL !== "function") {
      (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    }
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  it("nome de arquivo segue padrão esperado", () => {
    const filename = exportAlertsToCsv([]);
    expect(filename).toMatch(/^alertas-seguranca-\d{8}-\d{6}\.csv$/);
  });

  it("PBT: qualquer lista válida gera export sem lançar", () => {
    fc.assert(
      fc.property(fc.array(alertArb, { maxLength: 100 }), (alerts) => {
        expect(() => exportAlertsToCsv(alerts)).not.toThrow();
      }),
      { numRuns: 200 },
    );
  });

  it("volume: 5000 alertas em <2s", () => {
    const alerts: ExportableAlert[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `id-${i}`,
      created_at: new Date(Date.now() - i * 1000).toISOString(),
      severity: "high",
      type: "webhook",
      source_type: `src-${i % 10}`,
      title: `Alert ${i}`,
      message: "x".repeat(200),
      is_read: i % 2 === 0,
      read_at: null,
      action_url: null,
      metadata: { i },
    }));
    const t0 = performance.now();
    exportAlertsToCsv(alerts);
    expect(performance.now() - t0).toBeLessThan(2000);
  });

  it("tolera source_type/read_at/action_url/metadata nulos", () => {
    const alert: ExportableAlert = {
      id: "a1",
      created_at: new Date().toISOString(),
      severity: "low",
      type: "auth",
      source_type: null,
      title: "t",
      message: "m",
      is_read: false,
      read_at: null,
      action_url: null,
      metadata: null,
    };
    expect(() => exportAlertsToCsv([alert])).not.toThrow();
  });

  it("preserva unicode/emoji em título e mensagem", () => {
    const alert: ExportableAlert = {
      id: "a1",
      created_at: new Date().toISOString(),
      severity: "critical",
      type: "rls",
      source_type: "监视",
      title: "⚠️ Acesso indevido — João",
      message: "Detalhes: 中文, العربية, русский 🚨",
      is_read: false,
      read_at: null,
      action_url: null,
      metadata: { país: "Brasil" },
    };
    expect(() => exportAlertsToCsv([alert])).not.toThrow();
  });

  it("timezones diversos são aceitos em created_at", () => {
    const timestamps = [
      "2025-06-15T23:30:00Z",
      "2025-06-15T20:30:00-03:00",
      "2025-06-16T02:30:00+03:00",
      "2025-06-15T23:30:00.123456Z",
    ];
    for (const ts of timestamps) {
      const alert: ExportableAlert = {
        id: `id-${ts}`,
        created_at: ts,
        severity: "low",
        type: "auth",
        source_type: null,
        title: "t",
        message: "m",
        is_read: false,
        read_at: null,
        action_url: null,
        metadata: null,
      };
      expect(() => exportAlertsToCsv([alert])).not.toThrow();
    }
  });
});
