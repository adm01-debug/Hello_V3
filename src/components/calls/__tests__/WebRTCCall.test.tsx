import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { WebRTCCall } from "@/components/calls/WebRTCCall";

// --- Mocks de módulos ---
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }) },
}));

vi.mock("@/lib/webrtc-config", () => ({
  getIceServers: () => [{ urls: "stun:stun.l.google.com:19302" }],
  RECOMMENDED_AUDIO_CONSTRAINTS: { echoCancellation: true },
}));

vi.mock("@/hooks/useAudioOutputDevices", () => ({
  useAudioOutputDevices: () => ({
    supported: false,
    devices: [],
    selectedSinkId: "default",
    setSinkId: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
  }),
}));

// --- Helpers para construir mocks WebRTC ---
interface FakeTrack {
  kind: "audio";
  enabled: boolean;
  stop: ReturnType<typeof vi.fn>;
}

function createFakeAudioTrack(): FakeTrack {
  return { kind: "audio", enabled: true, stop: vi.fn() };
}

interface FakeSender {
  track: FakeTrack | null;
  replaceTrack: ReturnType<typeof vi.fn>;
}

interface FakePeerConnection {
  ontrack: ((ev: { streams: MediaStream[] }) => void) | null;
  oniceconnectionstatechange: (() => void) | null;
  onconnectionstatechange: (() => void) | null;
  iceConnectionState: RTCIceConnectionState;
  connectionState: RTCPeerConnectionState;
  addTransceiver: ReturnType<typeof vi.fn>;
  getSenders: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  restartIce: ReturnType<typeof vi.fn>;
  getStats: ReturnType<typeof vi.fn>;
  _sender: FakeSender;
}

function createFakePeerConnection(): FakePeerConnection {
  const sender: FakeSender = {
    track: null,
    replaceTrack: vi.fn().mockImplementation(async (t: FakeTrack) => {
      sender.track = t;
    }),
  };
  const pc: FakePeerConnection = {
    ontrack: null,
    oniceconnectionstatechange: null,
    onconnectionstatechange: null,
    iceConnectionState: "new",
    connectionState: "new",
    addTransceiver: vi.fn().mockReturnValue({ sender }),
    getSenders: vi.fn().mockReturnValue([sender]),
    close: vi.fn(),
    restartIce: vi.fn(),
    getStats: vi.fn().mockResolvedValue(new Map()),
    _sender: sender,
  };
  return pc;
}

let lastPc: FakePeerConnection | null = null;
let localTrack: FakeTrack;
let localStream: MediaStream;
let remoteStream: MediaStream;

beforeEach(() => {
  localTrack = createFakeAudioTrack();
  localStream = {
    getAudioTracks: () => [localTrack as unknown as MediaStreamTrack],
    getTracks: () => [localTrack as unknown as MediaStreamTrack],
  } as unknown as MediaStream;
  remoteStream = {
    getAudioTracks: () => [createFakeAudioTrack() as unknown as MediaStreamTrack],
    getTracks: () => [createFakeAudioTrack() as unknown as MediaStreamTrack],
  } as unknown as MediaStream;

  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue(localStream),
      enumerateDevices: vi.fn().mockResolvedValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });

  (globalThis as unknown as { RTCPeerConnection: unknown }).RTCPeerConnection = vi
    .fn()
    .mockImplementation(() => {
      lastPc = createFakePeerConnection();
      return lastPc;
    });

  // Silencia auto-play (jsdom não implementa play)
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});

afterEach(() => {
  lastPc = null;
  vi.restoreAllMocks();
});

async function startCall() {
  render(<WebRTCCall targetNumber="+551199999" />);
  fireEvent.click(screen.getByRole("button", { name: /ligar/i }));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}


describe("WebRTCCall", () => {
  it("anexa o stream remoto ao elemento <audio> quando ontrack dispara", async () => {
    const { container } = { container: document.body };
    await startCall();

    const audioEl = container.querySelector("audio") as HTMLAudioElement;
    expect(audioEl).toBeTruthy();
    expect(audioEl.srcObject).toBeNull();

    expect(lastPc).not.toBeNull();
    expect(lastPc!.ontrack).toBeInstanceOf(Function);

    await act(async () => {
      lastPc!.ontrack!({ streams: [remoteStream] });
    });

    expect(audioEl.srcObject).toBe(remoteStream);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("configura transceiver bidirecional e injeta a track local no sender", async () => {
    await startCall();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true },
    });
    expect(lastPc!.addTransceiver).toHaveBeenCalledWith("audio", { direction: "sendrecv" });
    expect(lastPc!._sender.replaceTrack).toHaveBeenCalledWith(localTrack);
    expect(lastPc!._sender.track).toBe(localTrack);
  });

  it("alterna a track do sender ao clicar em silenciar/ativar microfone", async () => {
    await startCall();

    // simula ICE conectado para revelar os botões de controle
    lastPc!.iceConnectionState = "connected";
    await act(async () => {
      lastPc!.oniceconnectionstatechange!();
    });

    expect(localTrack.enabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /silenciar microfone/i }));
    expect(localTrack.enabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /ativar microfone/i }));
    expect(localTrack.enabled).toBe(true);
  });
});
