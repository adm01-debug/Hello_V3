import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) },
}));

import { useContacts } from "../useContacts";
import { supabase } from "@/integrations/supabase/client";

describe("useContacts — OPTIMISTIC_LOCK_CONFLICT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "c1",
            external_id: null,
            name: "Contato 1",
            phone: "11999999999",
            email: null,
            company: null,
            position: null,
            notes: null,
            tags: null,
            preferences: {},
            personality_insights: {},
            source: "manual",
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "OPTIMISTIC_LOCK_CONFLICT: registro alterado" },
      }),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  });

  it("trata conflito com toast PT-BR e dispara refetch", async () => {
    const { result } = renderHook(() => useContacts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = (supabase.from as ReturnType<typeof vi.fn>).mock.calls.length;

    let updated: unknown;
    await act(async () => {
      updated = await result.current.updateContact("c1", { name: "Novo nome" });
    });

    expect(updated).toBeNull();
    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining("alterado por outro usuário"),
    );
    // Refetch foi disparado após o conflito
    expect(
      (supabase.from as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(callsBefore);
  });
});
