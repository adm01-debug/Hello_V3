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

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useDeals } from "../useDeals";
import { supabase } from "@/integrations/supabase/client";

describe("useDeals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [
        { id: "d1", name: "Deal 1", value_cents: 10000, stage: "prospecting", probability: 50,
          owner_agent_name: "Alice", currency: "BRL", status: "open" },
      ], error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("loads deals", async () => {
    const { result } = renderHook(() => useDeals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.deals).toHaveLength(1);
    expect(result.current.deals[0].name).toBe("Deal 1");
  });

  it("createDeal returns true on success", async () => {
    const { result } = renderHook(() => useDeals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.createDeal({ name: "X", value_cents: 100 }); });
    expect(ok).toBe(true);
  });

  it("computeHealth invokes edge function", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { healthScore: 80 }, error: null,
    });
    const { result } = renderHook(() => useDeals());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.computeHealth("d1"); });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("compute-deal-health", { body: { dealId: "d1" } });
  });
});
