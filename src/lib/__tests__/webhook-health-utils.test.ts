import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ratioColor,
  aggregateEndpoints,
  aggregateHeatmap,
  endpointsToCsv,
  SPARK_HOURS,
  type WebhookHealthRow,
} from "@/lib/webhook-health-utils";

const NOW = new Date("2026-04-18T12:00:00Z").getTime();

function row(overrides: Partial<WebhookHealthRow>): WebhookHealthRow {
  return {
    created_at: new Date(NOW).toISOString(),
    sent: 0,
    failed: 0,
    oldest_age_ms: null,
    duration_ms: null,
    endpoint_hash: "hash-a",
    ...overrides,
  };
}

describe("ratioColor", () => {
  it("retorna muted quando attempts=0", () => {
    expect(ratioColor(0.9, 0)).toBe("bg-muted/30");
  });
  it("classifica faixas por ratio", () => {
    expect(ratioColor(0.6, 100)).toBe("bg-destructive/90");
    expect(ratioColor(0.3, 100)).toBe("bg-destructive/60");
    expect(ratioColor(0.1, 100)).toBe("bg-warning/60");
    expect(ratioColor(0.01, 100)).toBe("bg-success/60");
  });
});

describe("aggregateEndpoints", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("agrega por hash, calcula ratio e ordena por volume", () => {
    const rows = [
      row({ endpoint_hash: "a", sent: 10, failed: 2 }),
      row({ endpoint_hash: "a", sent: 5, failed: 3 }),
      row({ endpoint_hash: "b", sent: 100, failed: 0 }),
    ];
    const out = aggregateEndpoints(rows, "volume");
    expect(out[0].hash).toBe("b");
    expect(out[0].attempts).toBe(100);
    const a = out.find((x) => x.hash === "a")!;
    expect(a.attempts).toBe(20);
    expect(a.failed).toBe(5);
    expect(a.ratio).toBeCloseTo(0.25, 5);
    expect(a.trend.length).toBe(SPARK_HOURS);
  });

  it("usa '—' quando endpoint_hash é null", () => {
    const out = aggregateEndpoints(
      [row({ endpoint_hash: null, sent: 1, failed: 1 })],
      "volume",
    );
    expect(out[0].hash).toBe("—");
  });

  it("ordena por ratio quando sortMode=ratio", () => {
    const rows = [
      row({ endpoint_hash: "low", sent: 100, failed: 1 }),
      row({ endpoint_hash: "high", sent: 2, failed: 8 }),
    ];
    const out = aggregateEndpoints(rows, "ratio");
    expect(out[0].hash).toBe("high");
  });

  it("ordena por trendDiff quando sortMode=trend", () => {
    const oneHourAgo = new Date(NOW - 60 * 60 * 1000).toISOString();
    const rows = [
      // "spiking": só falhou na hora atual
      row({ endpoint_hash: "spike", created_at: new Date(NOW).toISOString(), sent: 0, failed: 5 }),
      row({ endpoint_hash: "spike", created_at: oneHourAgo, sent: 10, failed: 0 }),
      // estável
      row({ endpoint_hash: "flat", created_at: new Date(NOW).toISOString(), sent: 10, failed: 0 }),
    ];
    const out = aggregateEndpoints(rows, "trend");
    expect(out[0].hash).toBe("spike");
    expect(out[0].trendDiff).toBeGreaterThan(0);
  });

  it("ignora linhas fora da janela de SPARK_HOURS", () => {
    const wayOld = new Date(NOW - 48 * 60 * 60 * 1000).toISOString();
    const out = aggregateEndpoints(
      [row({ endpoint_hash: "a", created_at: wayOld, sent: 5, failed: 5 })],
      "volume",
    );
    // sem entradas no trend
    expect(out[0].trend.every((v) => v === 0)).toBe(true);
    // mas ainda contabiliza attempts/failed
    expect(out[0].attempts).toBe(10);
  });
});

describe("aggregateHeatmap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("agrupa por dia/hora UTC e calcula failureRatio", () => {
    const rows = [
      row({ created_at: "2026-04-18T10:15:00Z", sent: 8, failed: 2 }),
      row({ created_at: "2026-04-18T10:45:00Z", sent: 0, failed: 5 }),
      row({ created_at: "2026-04-17T09:00:00Z", sent: 10, failed: 0 }),
    ];
    const { buckets, days, totals } = aggregateHeatmap(rows);
    const b10 = buckets.get("2026-04-18#10")!;
    expect(b10.sent).toBe(8);
    expect(b10.failed).toBe(7);
    expect(b10.attempts).toBe(15);
    expect(b10.failureRatio).toBeCloseTo(7 / 15, 5);
    expect(days).toContain("2026-04-18");
    expect(days.length).toBe(3);
    expect(totals).toEqual({ sent: 18, failed: 7 });
  });

  it("retorna totals zero quando não há linhas", () => {
    const { buckets, totals } = aggregateHeatmap([]);
    expect(buckets.size).toBe(0);
    expect(totals).toEqual({ sent: 0, failed: 0 });
  });
});

describe("endpointsToCsv", () => {
  it("gera cabeçalho + linhas com percentual formatado", () => {
    const csv = endpointsToCsv([
      { hash: "a", attempts: 100, failed: 25, trend: [], trendDiff: 0, ratio: 0.25 },
      { hash: "b", attempts: 0, failed: 0, trend: [], trendDiff: 0, ratio: 0 },
    ]);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("endpoint_hash,attempts,failed,failure_ratio_pct");
    expect(lines[1]).toBe("a,100,25,25.00");
    expect(lines[2]).toBe("b,0,0,0.00");
  });
});
