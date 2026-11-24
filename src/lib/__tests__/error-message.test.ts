import { describe, it, expect } from "vitest";
import { mensagemDeErro } from "@/lib/error-message";

describe("mensagemDeErro", () => {
  it("le o message de erro do PostgREST, que nao e uma instancia de Error", () => {
    const postgrest = { message: "permission denied for table dnc_list", code: "42501", details: null, hint: null };
    expect(postgrest instanceof Error).toBe(false);
    expect(mensagemDeErro(postgrest)).toBe("permission denied for table dnc_list");
  });

  it("aceita Error, string e valores soltos", () => {
    expect(mensagemDeErro(new Error("falhou"))).toBe("falhou");
    expect(mensagemDeErro("texto")).toBe("texto");
    expect(mensagemDeErro(null)).toBe("null");
    expect(mensagemDeErro({ code: "PGRST301" })).toBe("[object Object]");
  });
});
