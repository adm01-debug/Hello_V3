import { describe, it, expect, beforeEach } from "vitest";
import {
  safeParseInt,
  safeParseFloat,
  safeToFixed,
  onSafeNumberRejection,
  getSafeNumberMetrics,
  resetSafeNumberMetrics,
  type SafeNumberRejection,
} from "../safe-number";
import { withRequestId } from "../logger";

describe("safe-number instrumentation", () => {
  beforeEach(() => resetSafeNumberMetrics());

  it("emite evento com motivo e helper para input inválido", () => {
    const events: SafeNumberRejection[] = [];
    const unsub = onSafeNumberRejection((e) => events.push(e));
    try {
      expect(safeParseInt("abc", { fallback: 7 })).toBe(7);
      expect(safeParseFloat(null)).toBe(0);
      expect(safeToFixed(undefined, 2, 1.5)).toBe(1.5);
    } finally { unsub(); }

    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ helper: "safeParseInt", reason: "not_a_number" });
    expect(events[1]).toMatchObject({ helper: "safeParseFloat", reason: "null_or_undefined" });
    expect(events[2]).toMatchObject({ helper: "safeToFixed", reason: "null_or_undefined" });
  });

  it("reporta clamp de min/max sem descartar o valor", () => {
    const events: SafeNumberRejection[] = [];
    const unsub = onSafeNumberRejection((e) => events.push(e));
    try {
      expect(safeParseInt("999", { max: 10 })).toBe(10);
      expect(safeParseFloat("-3", { min: 0 })).toBe(0);
    } finally { unsub(); }
    expect(events.map((e) => e.reason)).toEqual(["clamped_max", "clamped_min"]);
  });

  it("propaga requestId ativo para os eventos", () => {
    const events: SafeNumberRejection[] = [];
    const unsub = onSafeNumberRejection((e) => events.push(e));
    try {
      withRequestId(() => safeParseInt("xx"), "req-abc-123");
    } finally { unsub(); }
    expect(events[0]?.requestId).toBe("req-abc-123");
  });

  it("agrega contadores por helper:reason", () => {
    safeParseInt("bad");
    safeParseInt("bad");
    safeParseFloat(null);
    const metrics = getSafeNumberMetrics();
    expect(metrics["safeParseInt:not_a_number"]).toBe(2);
    expect(metrics["safeParseFloat:null_or_undefined"]).toBe(1);
  });

  it("não emite evento para input válido dentro dos limites", () => {
    const events: SafeNumberRejection[] = [];
    const unsub = onSafeNumberRejection((e) => events.push(e));
    try {
      expect(safeParseInt("42", { min: 0, max: 100 })).toBe(42);
      expect(safeParseFloat(3.14)).toBeCloseTo(3.14);
    } finally { unsub(); }
    expect(events).toHaveLength(0);
  });

  it("subscriber que lança erro não derruba o helper", () => {
    const unsub = onSafeNumberRejection(() => { throw new Error("boom"); });
    try {
      expect(() => safeParseInt("nope", { fallback: 9 })).not.toThrow();
      expect(safeParseInt("nope", { fallback: 9 })).toBe(9);
    } finally { unsub(); }
  });
});
