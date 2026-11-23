import { describe, it, expect } from "vitest";
import { classifyMos, isPoorMos, MOS_THRESHOLDS } from "../mos";

describe("classifyMos", () => {
  it("usa 3.5 como fronteira de ruim", () => {
    expect(classifyMos(3.49)).toBe("poor");
    // 3,55 não pode ser ruim numa tela e mediano na outra (bug A-030).
    expect(classifyMos(3.55)).toBe("fair");
    expect(classifyMos(3.5)).toBe("fair");
  });

  it("separa mediano, bom e excelente", () => {
    expect(classifyMos(3.99)).toBe("fair");
    expect(classifyMos(4.0)).toBe("good");
    expect(classifyMos(4.29)).toBe("good");
    expect(classifyMos(4.3)).toBe("excellent");
  });

  it("trata ausência e valores inválidos como unknown", () => {
    expect(classifyMos(null)).toBe("unknown");
    expect(classifyMos(undefined)).toBe("unknown");
    expect(classifyMos(Number.NaN)).toBe("unknown");
  });
});

describe("isPoorMos", () => {
  it("só considera ruim abaixo de 3.5", () => {
    expect(isPoorMos(3.4)).toBe(true);
    expect(isPoorMos(3.5)).toBe(false);
    expect(isPoorMos(3.55)).toBe(false);
    expect(isPoorMos(null)).toBe(false);
    expect(isPoorMos(Number.NaN)).toBe(false);
  });

  it("usa a mesma constante que classifyMos", () => {
    expect(isPoorMos(MOS_THRESHOLDS.poor - 0.01)).toBe(true);
    expect(isPoorMos(MOS_THRESHOLDS.poor)).toBe(false);
    expect(classifyMos(MOS_THRESHOLDS.poor)).toBe("fair");
  });
});