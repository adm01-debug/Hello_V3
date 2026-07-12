import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAlertsExport } from "@/hooks/useAlertsExport";

// ---------- Mocks ----------
vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    dismiss: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/security-alerts-export", () => ({
  exportAlertsToCsv: vi.fn(() => "alerts-20260712.csv"),
  exportAlertsToPdf: vi.fn(() => "alerts-20260712.pdf"),
}));

const sendExportWebhook = vi.fn();
vi.mock("@/lib/security-alerts-webhook", () => ({
  sendExportWebhook: (...args: unknown[]) => sendExportWebhook(...args),
}));

const enqueueWebhook = vi.fn();
vi.mock("@/lib/security-alerts-webhook-queue", () => ({
  enqueueWebhook: (...args: unknown[]) => enqueueWebhook(...args),
}));

// Mock cadeia do Supabase — retorna 1 chunk com N linhas e depois vazio.
let mockRows: Array<Record<string, unknown>> = [];
const orderMock = vi.fn();
const limitMock = vi.fn();
const supabaseChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  limit: vi.fn(
    (): Promise<{ data: unknown; error: unknown }> =>
      Promise.resolve({ data: mockRows, error: null }),
  ),
};
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => supabaseChain) },
}));

// ---------- Fixtures ----------
function alert(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: crypto.randomUUID(),
    title: "Falha de login",
    message: "IP suspeito",
    severity: "critical",
    type: "auth",
    action_url: null,
    action_label: null,
    source_type: "auth",
    is_read: false,
    read_at: null,
    created_at: "2026-07-10T12:00:00Z",
    metadata: null,
    ...overrides,
  };
}

const recordWebhookHistory = vi.fn();

function baseParams(over: Partial<Parameters<typeof useAlertsExport>[0]> = {}) {
  return {
    sinceIso: "2026-06-01T00:00:00Z",
    searchTerm: "",
    sourceFilter: "__all__",
    webhookUrl: "",
    webhookSecret: "",
    webhookMaxAttempts: 3,
    webhookBaseDelayMs: 1,
    webhookMaxDelayMs: 1,
    recordWebhookHistory,
    ...over,
  };
}

describe("useAlertsExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRows = [alert(), alert({ severity: "info", is_read: true, source_type: "system" })];
  });
  afterEach(() => vi.restoreAllMocks());

  it("exporta CSV com escopo 'all' e sinaliza sucesso", async () => {
    const { result } = renderHook(() => useAlertsExport(baseParams()));
    await act(async () => {
      await result.current.handleExport("csv", "all");
    });
    const { exportAlertsToCsv } = await import("@/lib/security-alerts-export");
    expect(exportAlertsToCsv).toHaveBeenCalledTimes(1);
    const payload = (exportAlertsToCsv as unknown as import("vitest").Mock).mock.calls[0][0];
    expect(payload).toHaveLength(2);
    expect(result.current.isExporting).toBe(false);
  });

  it("filtra por scope='critical' — apenas alertas críticos", async () => {
    const { result } = renderHook(() => useAlertsExport(baseParams()));
    await act(async () => {
      await result.current.handleExport("csv", "critical");
    });
    const { exportAlertsToCsv } = await import("@/lib/security-alerts-export");
    const payload = (exportAlertsToCsv as unknown as import("vitest").Mock).mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0].severity).toBe("critical");
  });

  it("filtra por scope='unread' — apenas não-lidos", async () => {
    const { result } = renderHook(() => useAlertsExport(baseParams()));
    await act(async () => {
      await result.current.handleExport("pdf", "unread");
    });
    const { exportAlertsToPdf } = await import("@/lib/security-alerts-export");
    const payload = (exportAlertsToPdf as unknown as import("vitest").Mock).mock.calls[0][0];
    expect(payload.every((n: { is_read: boolean }) => !n.is_read)).toBe(true);
  });

  it("filtra por sourceFilter e searchTerm (case-insensitive)", async () => {
    mockRows = [
      alert({ source_type: "auth", title: "Login suspeito" }),
      alert({ source_type: "system", title: "Backup falhou" }),
    ];
    const { result } = renderHook(() =>
      useAlertsExport(baseParams({ sourceFilter: "auth", searchTerm: "LOGIN" })),
    );
    await act(async () => {
      await result.current.handleExport("csv");
    });
    const { exportAlertsToCsv } = await import("@/lib/security-alerts-export");
    const payload = (exportAlertsToCsv as unknown as import("vitest").Mock).mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0].title).toBe("Login suspeito");
  });

  it("emite warning e não exporta quando filtros zerarem o conjunto", async () => {
    mockRows = [alert({ severity: "info" })];
    const { toast } = await import("sonner");
    const { result } = renderHook(() => useAlertsExport(baseParams()));
    await act(async () => {
      await result.current.handleExport("csv", "critical");
    });
    expect(toast.warning).toHaveBeenCalledTimes(1);
    const { exportAlertsToCsv } = await import("@/lib/security-alerts-export");
    expect(exportAlertsToCsv).not.toHaveBeenCalled();
  });

  it("dispara webhook quando configurado e registra histórico (ok)", async () => {
    sendExportWebhook.mockResolvedValueOnce({
      ok: true, status: 200, signed: true, attempts: 1,
    });
    const { result } = renderHook(() =>
      useAlertsExport(baseParams({ webhookUrl: "https://ex.com/hook", webhookSecret: "s" })),
    );
    await act(async () => {
      await result.current.handleExport("csv");
    });
    expect(sendExportWebhook).toHaveBeenCalledTimes(1);
    expect(recordWebhookHistory).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, status: 200, kind: "export", signed: true }),
    );
    expect(enqueueWebhook).not.toHaveBeenCalled();
  });

  it("adiciona à fila local quando webhook falha", async () => {
    sendExportWebhook.mockResolvedValueOnce({
      ok: false, status: 500, error: "HTTP 500", attempts: 3, signed: false,
    });
    const { toast } = await import("sonner");
    const { result } = renderHook(() =>
      useAlertsExport(baseParams({ webhookUrl: "https://ex.com/hook" })),
    );
    await act(async () => {
      await result.current.handleExport("csv");
    });
    expect(enqueueWebhook).toHaveBeenCalledTimes(1);
    expect(recordWebhookHistory).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, status: 500 }),
    );
    expect(toast.error).toHaveBeenCalled();
  });

  it("captura exceções do fetch de alertas e reporta erro", async () => {
    supabaseChain.limit.mockImplementationOnce(() =>
      Promise.resolve({ data: null, error: new Error("db down") }),
    );
    const { toast } = await import("sonner");
    const { result } = renderHook(() => useAlertsExport(baseParams()));
    await act(async () => {
      await result.current.handleExport("csv");
    });
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Falha ao exportar"));
    await waitFor(() => expect(result.current.isExporting).toBe(false));
  });
});
