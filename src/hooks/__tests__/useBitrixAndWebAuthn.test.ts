 import { describe, it, expect, vi, beforeEach } from "vitest";
 import { renderHook, act } from "@testing-library/react";
 
 vi.mock("@/integrations/supabase/client", () => ({
   supabase: {
     functions: { invoke: vi.fn() },
     from: vi.fn().mockReturnThis(),
     select: vi.fn().mockReturnThis(),
     eq: vi.fn().mockReturnThis(),
     order: vi.fn().mockReturnThis(),
     insert: vi.fn().mockResolvedValue({ error: null }),
     delete: vi.fn().mockReturnThis(),
     update: vi.fn().mockReturnThis(),
     maybeSingle: vi.fn(),
     auth: { getUser: vi.fn() },
   },
 }));
 
 vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
 
 vi.mock("@/contexts/AuthContext", () => ({
   useAuthContext: () => ({ user: { id: "u1", email: "test@example.com" } }),
 }));
 
 vi.mock("@/lib/webauthn/webauthn-utils", () => ({
   isWebAuthnSupported: vi.fn(() => true),
   isPlatformAuthenticatorAvailable: vi.fn(() => Promise.resolve(true)),
   generateChallenge: vi.fn(() => "mock-challenge"),
   startRegistration: vi.fn(() => Promise.resolve({ credentialId: "c1", publicKey: "p1", transports: [] })),
   startAuthentication: vi.fn(() => Promise.resolve({ credentialId: "c1" })),
 }));
 
 import { useBitrix } from "../useBitrix";
 import { useWebAuthn } from "../useWebAuthn";
 import { supabase } from "@/integrations/supabase/client";
 
 describe("useBitrix", () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });
 
   it("gets contacts from Bitrix", async () => {
     vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
       data: { success: true, data: [{ ID: "1", NAME: "John" }] },
       error: null,
     });
 
     const { result } = renderHook(() => useBitrix());
     let data: Awaited<ReturnType<typeof result.current.getContacts>>;
     await act(async () => {
       data = await result.current.getContacts();
     });
 
     expect(data).toHaveLength(1);
     expect(data[0].NAME).toBe("John");
     expect(supabase.functions.invoke).toHaveBeenCalledWith("bitrix-api", expect.objectContaining({
       body: expect.objectContaining({ action: "get_contacts" }),
     }));
   });
 
   it("handles unconfigured service", async () => {
     vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
       data: { configured: false },
       error: null,
     });
 
     const { result } = renderHook(() => useBitrix());
     let data!: Awaited<ReturnType<typeof result.current.checkConfiguration>>;
     await act(async () => {
       data = await result.current.checkConfiguration();
     });
 
     expect(data).toBe(false);
     expect(result.current.isConfigured).toBe(false);
   });
 });
 
 describe("useWebAuthn", () => {
   beforeEach(() => {
     vi.clearAllMocks();
     const mockFrom = {
       select: vi.fn().mockReturnThis(),
       eq: vi.fn().mockReturnThis(),
       order: vi.fn().mockReturnThis(),
       insert: vi.fn().mockResolvedValue({ error: null }),
       delete: vi.fn().mockReturnThis(),
       update: vi.fn().mockReturnThis(),
     };
     vi.mocked(supabase.from).mockReturnValue(mockFrom as unknown as ReturnType<typeof supabase.from>);
     // Default for order.mockResolvedValue is needed for initial load
     mockFrom.order.mockResolvedValue({ data: [], error: null });
   });
 
   it("loads passkeys on mount", async () => {
     vi.mocked(supabase.from).mockReturnValue({
       select: vi.fn().mockReturnThis(),
       eq: vi.fn().mockReturnThis(),
       order: vi.fn().mockResolvedValue({ data: [{ id: "p1", friendly_name: "My Key" }], error: null }),
     } as unknown as ReturnType<typeof supabase.from>);
 
     const { result } = renderHook(() => useWebAuthn());
     // Wait for initial load
     await act(async () => {});
 
     expect(result.current.passkeys).toHaveLength(1);
     expect(result.current.passkeys[0].friendly_name).toBe("My Key");
   });
 
   it("registers a new passkey", async () => {
     const { result } = renderHook(() => useWebAuthn());
     let success = false;
     await act(async () => {
       success = await result.current.registerPasskey("Test Key");
     });
 
     expect(success).toBe(true);
     expect(supabase.from).toHaveBeenCalledWith("webauthn_challenges");
     expect(supabase.from).toHaveBeenCalledWith("user_passkeys");
   });
 });
