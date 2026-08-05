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
  beforeEach(() => {
    vi.clearAllMocks();
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [
        { id: "d1", name: "Deal 1", value_cents: 10000, stage: "prospecting",
          probability: 50, owner_agent_name: "Alice", currency: "BRL", status: "open", version: 1 },
      ], error: null }),
      update: vi.fn().mockReturnThis(),
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
});
