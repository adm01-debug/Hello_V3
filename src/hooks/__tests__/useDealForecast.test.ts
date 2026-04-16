import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

import { useDealForecast } from "../useDealForecast";
import { supabase } from "@/integrations/supabase/client";

describe("useDealForecast", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches forecast on mount with default period", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        period: "month", horizon: "2025-01-01", total_deals: 3,
        total_pipeline_cents: 100000, weighted_forecast_cents: 50000,
        best_case_cents: 80000, commit_cents: 30000, confidence: 75, by_stage: {},
      }, error: null,
    });
    const { result } = renderHook(() => useDealForecast());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.total_deals).toBe(3);
    expect(result.current.data?.confidence).toBe(75);
    expect(supabase.functions.invoke).toHaveBeenCalledWith("forecast-deals", { body: { period: "month" } });
  });

  it("handles error gracefully", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null, error: { message: "fail" },
    });
    const { result } = renderHook(() => useDealForecast("week"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(null);
  });
});
