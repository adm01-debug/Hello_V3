import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) } }));

import { useDeals } from "../useDeals";
import { supabase } from "@/integrations/supabase/client";

describe("useDeals — OPTIMISTIC_LOCK_CONFLICT", () => {
  let updateMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock = vi.fn().mockReturnThis();
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [
        { id: "d1", name: "Deal 1", value_cents: 10000, stage: "prospecting",
          probability: 50, owner_agent_name: "Alice", currency: "BRL", status: "open", version: 1 },
      ], error: null, count: 1 }),
      update: updateMock,
      eq: vi.fn().mockResolvedValue({
        error: { message: "OPTIMISTIC_LOCK_CONFLICT: registro alterado" },
      }),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(selectChain);
  });

  it("trata conflito com toast PT-BR e dispara refetch", async () => {
    const { result } = renderHook(() => useDeals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.updateDeal("d1", { name: "X" });
    });

    expect(ok).toBe(false);
    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining("alterada por outro usuário"),
    );
    // Refetch foi disparado (from chamado >1x para deals)
    expect((supabase.from as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1);
  });

  it("envia version da linha lida no update (lock otimista ativo)", async () => {
    const { result } = renderHook(() => useDeals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateDeal("d1", { name: "X" });
    });

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ name: "X", version: 1 }));
  });

  it("updateStage (kanban) também envia version", async () => {
    const { result } = renderHook(() => useDeals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateStage("d1", "negotiation");
    });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "negotiation", version: 1 }),
    );
  });

  it("respeita version explícita do patch", async () => {
    const { result } = renderHook(() => useDeals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateDeal("d1", { name: "X", version: 7 });
    });

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ version: 7 }));
  });
});
