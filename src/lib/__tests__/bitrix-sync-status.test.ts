import { describe, expect, it } from "vitest";
import { normalizarSyncStatus } from "@/lib/bitrix/sync-log";

/**
 * A tabela crm_sync_queue tem dois vocabularios: a edge sync-crm-queue grava
 * processing/completed e o front grava in_progress/success. A normalizacao
 * evita que a linha processada pelo cron apareca como "Pendente" na tela.
 */
describe("normalizarSyncStatus", () => {
  it("traduz o vocabulario da edge", () => {
    expect(normalizarSyncStatus("processing")).toBe("in_progress");
    expect(normalizarSyncStatus("completed")).toBe("success");
    expect(normalizarSyncStatus("failed")).toBe("failed");
  });

  it("preserva o vocabulario do front", () => {
    expect(normalizarSyncStatus("in_progress")).toBe("in_progress");
    expect(normalizarSyncStatus("success")).toBe("success");
    expect(normalizarSyncStatus("pending")).toBe("pending");
  });

  it("cai em pendente para nulo, vazio e valor desconhecido", () => {
    expect(normalizarSyncStatus(null)).toBe("pending");
    expect(normalizarSyncStatus(undefined)).toBe("pending");
    expect(normalizarSyncStatus("")).toBe("pending");
    expect(normalizarSyncStatus("COMPLETED")).toBe("pending");
    expect(normalizarSyncStatus("qualquer-coisa")).toBe("pending");
  });

  it("nunca devolve status fora do contrato da UI", () => {
    const contrato = ["in_progress", "success", "failed", "pending"];
    const entradas = [
      "pending",
      "processing",
      "in_progress",
      "completed",
      "success",
      "failed",
      "",
      null,
      undefined,
      "erro",
    ];
    for (const entrada of entradas) {
      expect(contrato).toContain(normalizarSyncStatus(entrada));
    }
  });
});