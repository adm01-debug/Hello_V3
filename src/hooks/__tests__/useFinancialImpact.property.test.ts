// Property-based tests para os helpers puros do módulo Financial Impact.
// Invariantes cobertos: linearidade de summarize, aditividade parcial,
// coerência de ROI/CAC/lucro e propriedades de `pct` (identidade,
// simetria de sinal, robustez a previous=0, monotonicidade).
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  summarize,
  pct,
  financialImpactToCSV,
  type FinancialImpactDay,
} from "@/hooks/useFinancialImpact";

const arbDay = (): fc.Arbitrary<FinancialImpactDay> =>
  fc.record({
    day: fc
      .integer({ min: 0, max: 3650 })
      .map((n) => new Date(Date.UTC(2024, 0, 1) + n * 86_400_000).toISOString().slice(0, 10)),
    total_calls: fc.integer({ min: 0, max: 5_000 }),
    total_seconds: fc.integer({ min: 0, max: 500_000 }),
    estimated_cost_cents: fc.integer({ min: 0, max: 10_000_000 }),
    revenue_cents: fc.integer({ min: 0, max: 100_000_000 }),
    deals_won: fc.integer({ min: 0, max: 500 }),
    profit_cents: fc.integer({ min: -50_000_000, max: 100_000_000 }),
  });

describe("useFinancialImpact helpers (PBT)", () => {
  it("summarize: linearidade dos totais e sinal do lucro coerente", () => {
    fc.assert(
      fc.property(fc.array(arbDay(), { maxLength: 90 }), (series) => {
        const s = summarize(series);
        const sumCost = series.reduce((a, d) => a + d.estimated_cost_cents, 0);
        const sumRev = series.reduce((a, d) => a + d.revenue_cents, 0);
        const sumCalls = series.reduce((a, d) => a + d.total_calls, 0);
        const sumDeals = series.reduce((a, d) => a + d.deals_won, 0);
        expect(s.total_cost_cents).toBe(sumCost);
        expect(s.total_revenue_cents).toBe(sumRev);
        expect(s.total_calls).toBe(sumCalls);
        expect(s.total_deals_won).toBe(sumDeals);
        expect(s.total_profit_cents).toBe(sumRev - sumCost);
        // CAC = cost / deals (ou 0 quando não há deals)
        if (sumDeals === 0) expect(s.cac_cents).toBe(0);
        else expect(s.cac_cents).toBe(Math.round(sumCost / sumDeals));
        // ROI: sinal segue lucro (com custo > 0)
        if (sumCost > 0) {
          if (s.total_profit_cents > 0) expect(s.roi_percent).toBeGreaterThan(0);
          if (s.total_profit_cents < 0) expect(s.roi_percent).toBeLessThan(0);
        } else {
          expect(s.roi_percent).toBe(0);
        }
      }),
      { numRuns: 400 },
    );
  });

  it("summarize: aditividade — summarize(A∪B) == somar totais individuais", () => {
    fc.assert(
      fc.property(fc.array(arbDay(), { maxLength: 30 }), fc.array(arbDay(), { maxLength: 30 }), (a, b) => {
        const sa = summarize(a);
        const sb = summarize(b);
        const sab = summarize([...a, ...b]);
        expect(sab.total_cost_cents).toBe(sa.total_cost_cents + sb.total_cost_cents);
        expect(sab.total_revenue_cents).toBe(sa.total_revenue_cents + sb.total_revenue_cents);
        expect(sab.total_calls).toBe(sa.total_calls + sb.total_calls);
        expect(sab.total_deals_won).toBe(sa.total_deals_won + sb.total_deals_won);
      }),
      { numRuns: 300 },
    );
  });

  it("pct: identidade, previous=0 e simetria de sinal", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: 1_000_000 }), (x) => {
        // Identidade
        if (x !== 0) expect(pct(x, x)).toBe(0);
        // previous=0: 0→0, x≠0→100
        expect(pct(0, 0)).toBe(0);
        if (x !== 0) expect(pct(x, 0)).toBe(100);
      }),
      { numRuns: 400 },
    );
  });

  it("pct: sinal correto vs previous (com abs no denominador)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000, max: 1_000_000 }),
        fc.integer({ min: -1_000_000, max: 1_000_000 }).filter((n) => n !== 0),
        (current, previous) => {
          const p = pct(current, previous);
          if (current > previous) expect(p).toBeGreaterThan(0);
          else if (current < previous) expect(p).toBeLessThan(0);
          else expect(p).toBe(0);
        },
      ),
      { numRuns: 400 },
    );
  });

  it("financialImpactToCSV: header + 1 linha por dia, cada linha com 7 campos", () => {
    fc.assert(
      fc.property(fc.array(arbDay(), { maxLength: 40 }), (series) => {
        const csv = financialImpactToCSV(series);
        const lines = csv.split("\r\n");
        expect(lines.length).toBe(series.length + 1);
        for (const l of lines) expect(l.split(",").length).toBe(7);
      }),
      { numRuns: 200 },
    );
  });
});
