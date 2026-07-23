import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { useAudioOutputDevices } from "@/hooks/useAudioOutputDevices";

function setupMediaDevices(devices: MediaDeviceInfo[]) {
  const listeners: Record<string, EventListener[]> = {};
  const md = {
    enumerateDevices: vi.fn().mockResolvedValue(devices),
    addEventListener: vi.fn((ev: string, cb: EventListener) => {
      (listeners[ev] ||= []).push(cb);
    }),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(navigator, "mediaDevices", {
    value: md,
    configurable: true,
  });
  return { md, listeners };
}

function makeAudioEl(setSinkImpl?: (id: string) => Promise<void>) {
  const audio = document.createElement("audio") as HTMLAudioElement & {
    setSinkId?: (id: string) => Promise<void>;
  };
  audio.setSinkId = setSinkImpl ?? vi.fn().mockResolvedValue(undefined);
  return audio;
}

describe("useAudioOutputDevices", () => {
  const originalSetSink = (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown })
    .setSinkId;

  beforeEach(() => {
    (HTMLMediaElement.prototype as unknown as { setSinkId: (id: string) => Promise<void> })
      .setSinkId = vi.fn().mockResolvedValue(undefined);
    window.localStorage.clear();
  });

  afterEach(() => {
    (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId =
      originalSetSink;
    vi.restoreAllMocks();
  });

  it("reporta não suportado quando setSinkId ausente", () => {
    delete (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId;
    const { result } = renderHook(() => {
      const ref = useRef<HTMLAudioElement | null>(null);
      return useAudioOutputDevices(ref);
    });
    expect(result.current.supported).toBe(false);
  });

  it("enumera dispositivos de saída e ignora inputs", async () => {
    setupMediaDevices([
      { deviceId: "spk-1", kind: "audiooutput", label: "Speakers", groupId: "" } as MediaDeviceInfo,
      { deviceId: "mic-1", kind: "audioinput", label: "Mic", groupId: "" } as MediaDeviceInfo,
      { deviceId: "spk-2", kind: "audiooutput", label: "", groupId: "" } as MediaDeviceInfo,
    ]);
    const { result } = renderHook(() => {
      const ref = useRef<HTMLAudioElement | null>(null);
      return useAudioOutputDevices(ref);
    });
    await waitFor(() => expect(result.current.devices.length).toBe(2));
    expect(result.current.devices[0].deviceId).toBe("spk-1");
    expect(result.current.devices[1].label).toMatch(/Saída/);
  });

  it("persiste a preferência ao chamar setSinkId com sucesso", async () => {
    setupMediaDevices([]);
    const audio = makeAudioEl();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLAudioElement | null>(audio);
      return useAudioOutputDevices(ref);
    });
    await act(async () => {
      await result.current.setSinkId("spk-1");
    });
    expect(result.current.selectedSinkId).toBe("spk-1");
    expect(window.localStorage.getItem("webrtc:preferred-sink-id")).toBe("spk-1");
  });

  it("propaga erro quando setSinkId falha", async () => {
    setupMediaDevices([]);
    const audio = makeAudioEl(vi.fn().mockRejectedValue(new Error("boom")));
    const { result } = renderHook(() => {
      const ref = useRef<HTMLAudioElement | null>(audio);
      return useAudioOutputDevices(ref);
    });
    await expect(
      act(async () => {
        await result.current.setSinkId("spk-x");
      }),
    ).rejects.toThrow(/boom/);
  });

  it("re-enumera quando devicechange dispara", async () => {
    const { md, listeners } = setupMediaDevices([]);
    renderHook(() => {
      const ref = useRef<HTMLAudioElement | null>(null);
      return useAudioOutputDevices(ref);
    });
    await waitFor(() => expect(md.enumerateDevices).toHaveBeenCalledTimes(1));
    await act(async () => {
      listeners["devicechange"]?.forEach((cb) => cb(new Event("devicechange")));
    });
    await waitFor(() => expect(md.enumerateDevices).toHaveBeenCalledTimes(2));
  });
});
