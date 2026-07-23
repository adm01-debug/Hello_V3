import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("getIceServers", () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restaura env
    Object.assign(import.meta.env, originalEnv);
  });

  it("retorna STUN servers padrão sem TURN quando envs ausentes", async () => {
    // @ts-expect-error - manipulação controlada de env em teste
    import.meta.env.VITE_TURN_URL = undefined;
    // @ts-expect-error
    import.meta.env.VITE_TURN_USER = undefined;
    // @ts-expect-error
    import.meta.env.VITE_TURN_CRED = undefined;

    const { getIceServers } = await import("@/lib/webrtc-config");
    const servers = getIceServers();
    expect(servers.length).toBeGreaterThanOrEqual(2);
    const flat = JSON.stringify(servers);
    expect(flat).toContain("stun:stun.l.google.com");
    expect(flat).toContain("stun:stun.cloudflare.com");
    expect(flat).not.toContain("turn:");
  });

  it("inclui TURN quando todas as envs estão presentes", async () => {
    // @ts-expect-error
    import.meta.env.VITE_TURN_URL = "turn:turn.example.com:3478";
    // @ts-expect-error
    import.meta.env.VITE_TURN_USER = "user";
    // @ts-expect-error
    import.meta.env.VITE_TURN_CRED = "cred";

    const { getIceServers } = await import("@/lib/webrtc-config");
    const servers = getIceServers();
    const turn = servers.find((s) =>
      (Array.isArray(s.urls) ? s.urls.join(",") : s.urls).includes("turn:"),
    );
    expect(turn).toBeDefined();
    expect(turn?.username).toBe("user");
    expect(turn?.credential).toBe("cred");
  });

  it("não inclui TURN quando falta uma das credenciais", async () => {
    // @ts-expect-error
    import.meta.env.VITE_TURN_URL = "turn:turn.example.com:3478";
    // @ts-expect-error
    import.meta.env.VITE_TURN_USER = "user";
    // @ts-expect-error
    import.meta.env.VITE_TURN_CRED = undefined;

    const { getIceServers } = await import("@/lib/webrtc-config");
    const servers = getIceServers();
    const flat = JSON.stringify(servers);
    expect(flat).not.toContain("turn:");
  });
});

describe("RECOMMENDED_AUDIO_CONSTRAINTS", () => {
  it("ativa cancelamento de eco, supressão de ruído e AGC", async () => {
    const { RECOMMENDED_AUDIO_CONSTRAINTS } = await import("@/lib/webrtc-config");
    expect(RECOMMENDED_AUDIO_CONSTRAINTS.echoCancellation).toBe(true);
    expect(RECOMMENDED_AUDIO_CONSTRAINTS.noiseSuppression).toBe(true);
    expect(RECOMMENDED_AUDIO_CONSTRAINTS.autoGainControl).toBe(true);
  });
});
