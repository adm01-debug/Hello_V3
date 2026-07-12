import { describe, it, expect } from "vitest";
import { hashEndpoint } from "@/lib/security-alerts-webhook-queue";

describe("hashEndpoint", () => {
  it("gera hash de exatamente 12 caracteres hexadecimais", () => {
    const h = hashEndpoint("https://exemplo.com/webhook");
    expect(h).toMatch(/^[0-9a-f]{12}$/);
  });

  it("é determinístico (mesma URL → mesmo hash)", () => {
    const url = "https://api.acme.io/v1/hook?token=xyz";
    expect(hashEndpoint(url)).toBe(hashEndpoint(url));
  });

  it("diferencia URLs quase idênticas (path)", () => {
    expect(hashEndpoint("https://a.com/x")).not.toBe(hashEndpoint("https://a.com/y"));
  });

  it("diferencia URLs quase idênticas (query)", () => {
    expect(hashEndpoint("https://a.com/hook?a=1")).not.toBe(
      hashEndpoint("https://a.com/hook?a=2"),
    );
  });

  it("diferencia hosts distintos com mesmo path", () => {
    expect(hashEndpoint("https://a.com/hook")).not.toBe(hashEndpoint("https://b.com/hook"));
  });

  it("diferencia protocolo http vs https", () => {
    expect(hashEndpoint("http://a.com/hook")).not.toBe(hashEndpoint("https://a.com/hook"));
  });

  it("suporta URLs vazias sem lançar", () => {
    const h = hashEndpoint("");
    expect(h).toMatch(/^[0-9a-f]{12}$/);
  });

  it("baixa colisão em amostra de 1000 URLs sintéticas", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      set.add(hashEndpoint(`https://tenant-${i}.exemplo.com/webhook/${i * 7}`));
    }
    // Tolerância: no máximo 2 colisões em 1000 (0,2%).
    expect(set.size).toBeGreaterThanOrEqual(998);
  });

  it("é sensível a caracteres unicode", () => {
    expect(hashEndpoint("https://a.com/ção")).not.toBe(hashEndpoint("https://a.com/cao"));
  });
});
