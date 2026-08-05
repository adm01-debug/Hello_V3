import { describe, it, expect, beforeEach, vi } from "vitest";

type MutableEnv = Record<string, string | undefined>;

describe("getIceServers", () => {
  const env = import.meta.env as unknown as MutableEnv;


  beforeEach(() => {
    vi.resetModules();
    delete env.VITE_TURN_URL;
    delete env.VITE_TURN_USER;
    delete env.VITE_TURN_CRED;
  });


  it("retorna STUN servers padrão sem TURN quando envs ausentes", async () => {


    const { getIceServers } = await import("@/lib/webrtc-config");
    const servers = getIceServers();
    expect(servers.length).toBeGreaterThanOrEqual(2);
    const flat = JSON.stringify(servers);
    expect(flat).toContain("stun:stun.l.google.com");
    expect(flat).toContain("stun:stun.cloudflare.com");
    expect(flat).not.toContain("turn:");
  });

  it("inclui TURN quando todas as envs estão presentes", async () => {
    env.VITE_TURN_URL = "turn:turn.example.com:3478";
    env.VITE_TURN_USER = "user";
    env.VITE_TURN_CRED = "cred";

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
    env.VITE_TURN_URL = "turn:turn.example.com:3478";
    env.VITE_TURN_USER = "user";
    delete env.VITE_TURN_CRED;


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
