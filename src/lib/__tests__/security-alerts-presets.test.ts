/**
 * Testes unitários e de integração para `security-alerts-presets.ts`.
 * Cobrem persistência em localStorage, dedupe por nome, limite MAX_PRESETS,
 * validação de entradas malformadas e resiliência a JSON corrompido.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  addPreset,
  loadPresets,
  removePreset,
  type AlertFilterPreset,
} from "@/lib/security-alerts-presets";

const STORAGE_KEY = "security-alerts:filter-presets:v1";

beforeEach(() => {
  window.localStorage.clear();
});

describe("security-alerts-presets", () => {
  describe("loadPresets", () => {
    it("retorna [] quando storage vazio", () => {
      expect(loadPresets()).toEqual([]);
    });

    it("retorna [] quando JSON inválido", () => {
      window.localStorage.setItem(STORAGE_KEY, "{not json");
      expect(loadPresets()).toEqual([]);
    });

    it("retorna [] quando payload não é array", () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }));
      expect(loadPresets()).toEqual([]);
    });

    it("filtra entradas com shape inválido", () => {
      const valid: AlertFilterPreset = {
        id: "p1",
        name: "Preset ok",
        source: "__all__",
        q: "",
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([valid, { id: 1, broken: true }, null, "x"]),
      );
      const result = loadPresets();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("p1");
    });
  });

  describe("addPreset", () => {
    it("rejeita nome vazio ou só espaços", () => {
      expect(() => addPreset({ name: "  ", source: "__all__", q: "" })).toThrow();
      expect(() => addPreset({ name: "", source: "__all__", q: "" })).toThrow();
    });

    it("cria preset e persiste em localStorage", () => {
      const p = addPreset({ name: "Críticos", source: "webhook", q: "erro" });
      expect(p.name).toBe("Críticos");
      expect(p.source).toBe("webhook");
      expect(p.q).toBe("erro");
      expect(p.id).toBeTruthy();
      const stored = loadPresets();
      expect(stored).toHaveLength(1);
      expect(stored[0]?.name).toBe("Críticos");
    });

    it("trima nome antes de salvar", () => {
      const p = addPreset({ name: "  Espaço  ", source: "__all__", q: "" });
      expect(p.name).toBe("Espaço");
    });

    it("insere no topo (mais recente primeiro)", () => {
      addPreset({ name: "Primeiro", source: "__all__", q: "" });
      addPreset({ name: "Segundo", source: "__all__", q: "" });
      const list = loadPresets();
      expect(list[0]?.name).toBe("Segundo");
      expect(list[1]?.name).toBe("Primeiro");
    });

    it("dedupe por nome (case-insensitive) preservando id", () => {
      const first = addPreset({ name: "Alertas", source: "a", q: "x" });
      const second = addPreset({ name: "ALERTAS", source: "b", q: "y" });
      expect(second.id).toBe(first.id);
      expect(second.source).toBe("b");
      expect(second.q).toBe("y");
      const list = loadPresets();
      expect(list).toHaveLength(1);
      expect(list[0]?.source).toBe("b");
    });

    it("respeita MAX_PRESETS=20 (descarta excedentes)", () => {
      for (let i = 0; i < 25; i++) {
        addPreset({ name: `Preset ${i}`, source: "__all__", q: "" });
      }
      const list = loadPresets();
      expect(list).toHaveLength(20);
      // Mais recentes preservados no topo
      expect(list[0]?.name).toBe("Preset 24");
      expect(list[19]?.name).toBe("Preset 5");
    });
  });

  describe("removePreset", () => {
    it("remove preset pelo id", () => {
      const a = addPreset({ name: "A", source: "__all__", q: "" });
      const b = addPreset({ name: "B", source: "__all__", q: "" });
      removePreset(a.id);
      const list = loadPresets();
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe(b.id);
    });

    it("é no-op quando id não existe", () => {
      addPreset({ name: "A", source: "__all__", q: "" });
      removePreset("id-inexistente");
      expect(loadPresets()).toHaveLength(1);
    });
  });

  describe("integração — ciclo completo", () => {
    it("add → load → remove → load reflete estado consistente", () => {
      const p1 = addPreset({ name: "Filtro 1", source: "auth", q: "login" });
      const p2 = addPreset({ name: "Filtro 2", source: "webhook", q: "" });
      expect(loadPresets()).toHaveLength(2);
      removePreset(p1.id);
      const remaining = loadPresets();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe(p2.id);
      expect(remaining[0]?.source).toBe("webhook");
    });
  });
});
