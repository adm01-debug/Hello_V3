import { describe, it, expect } from "vitest";
import { normalizarTelefone, reconciliarDNC, lotesParaConsulta } from "@/lib/dnc/reconcile";

describe("normalizarTelefone", () => {
  it("leva o numero BR para a forma canonica +55", () => {
    expect(normalizarTelefone("(11) 99999-0001")).toBe("+5511999990001");
    expect(normalizarTelefone("+55 11 99999 0001")).toBe("+5511999990001");
    expect(normalizarTelefone("5511999990001")).toBe("+5511999990001");
  });

  it("cai para digitos quando nao da para reconhecer a forma BR", () => {
    expect(normalizarTelefone("123456789")).toBe("123456789");
    expect(normalizarTelefone("")).toBe("");
  });
});

describe("reconciliarDNC", () => {
  it("aponta exatamente o numero que nao esta na lista", () => {
    const r = reconciliarDNC(
      ["11999990001", "11999990002", "11999990003"],
      ["11999990001", "11999990003"],
    );
    expect(r.presentes).toEqual(["11999990001", "11999990003"]);
    expect(r.ausentes).toEqual(["11999990002"]);
    expect(r.invalidos).toEqual([]);
  });

  it("compara pelo telefone normalizado, ignorando a mascara", () => {
    const r = reconciliarDNC(["(21) 88888-0002"], ["21888880002"]);
    expect(r.ausentes).toEqual([]);
    expect(r.presentes).toEqual(["(21) 88888-0002"]);
  });

  it("reconhece o mesmo numero com e sem o +55", () => {
    const r = reconciliarDNC(["5511999990001"], ["11999990001"]);
    expect(r.ausentes).toEqual([]);
    expect(r.presentes).toEqual(["5511999990001"]);
  });

  it("nao trata numeros de DDDs diferentes como iguais", () => {
    const r = reconciliarDNC(["21999990001"], ["11999990001"]);
    expect(r.ausentes).toEqual(["21999990001"]);
  });

  it("separra o que nem telefone e", () => {
    const r = reconciliarDNC(["123", "sem numero", "11999990001"], []);
    expect(r.invalidos).toEqual(["123", "sem numero"]);
    expect(r.ausentes).toEqual(["11999990001"]);
  });

  it("remove repetidos do proprio arquivo", () => {
    const r = reconciliarDNC(["(11) 99999-0001", "11999990001"], []);
    expect(r.ausentes).toEqual(["(11) 99999-0001"]);
  });

  it("lista vazia nao explode", () => {
    expect(reconciliarDNC([], [null, undefined, ""])).toEqual({ presentes: [], ausentes: [], invalidos: [] });
  });
});

describe("lotesParaConsulta", () => {
  it("quebra em lotes de 200 para o .in() do PostgREST", () => {
    const numeros = Array.from({ length: 450 }, (_, i) => String(i));
    const lotes = lotesParaConsulta(numeros);
    expect(lotes.map((l) => l.length)).toEqual([200, 200, 50]);
  });

  it("lista vazia nao gera lote", () => {
    expect(lotesParaConsulta([])).toEqual([]);
  });
});
