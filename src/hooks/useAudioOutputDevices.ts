import { useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";

const STORAGE_KEY = "webrtc:preferred-sink-id";

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

interface UseAudioOutputDevicesResult {
  supported: boolean;
  devices: AudioOutputDevice[];
  selectedSinkId: string;
  setSinkId: (deviceId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Enumera dispositivos de saída de áudio e persiste a preferência do usuário.
 * O suporte a setSinkId varia por navegador (Chromium-based sim, Safari/Firefox limitado).
 */
export function useAudioOutputDevices(
  audioRef: React.RefObject<HTMLAudioElement | null>,
): UseAudioOutputDevicesResult {
  const supported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.enumerateDevices &&
    typeof (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown })
      .setSinkId === "function";

  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const [selectedSinkId, setSelectedSinkId] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    return window.localStorage.getItem(STORAGE_KEY) ?? "default";
  });

  const refresh = useCallback(async () => {
    if (!supported) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const outputs = all
        .filter((d) => d.kind === "audiooutput")
        .map((d, i) => ({
          deviceId: d.deviceId || "default",
          label: d.label || `Saída ${i + 1}`,
        }));
      setDevices(outputs);
    } catch (err) {
      logger.warn("Falha ao enumerar dispositivos de áudio:", err);
    }
  }, [supported]);

  const setSinkId = useCallback(
    async (deviceId: string) => {
      const audio = audioRef.current as
        | (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> })
        | null;
      if (!supported || !audio || typeof audio.setSinkId !== "function") {
        setSelectedSinkId(deviceId);
        return;
      }
      try {
        await audio.setSinkId(deviceId);
        setSelectedSinkId(deviceId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, deviceId);
        }
      } catch (err) {
        logger.warn("setSinkId falhou:", err);
        throw err;
      }
    },
    [audioRef, supported],
  );

  useEffect(() => {
    if (!supported) return;
    void refresh();
    const handler = () => {
      void refresh();
    };
    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handler);
    };
  }, [supported, refresh]);

  // Reaplica sink preferido quando o elemento é montado ou trocado.
  useEffect(() => {
    if (!supported || !audioRef.current) return;
    const audio = audioRef.current as HTMLAudioElement & {
      setSinkId?: (id: string) => Promise<void>;
    };
    if (typeof audio.setSinkId === "function" && selectedSinkId) {
      audio.setSinkId(selectedSinkId).catch((err) => {
        logger.warn("Falha ao reaplicar sinkId preferido:", err);
      });
    }
  }, [supported, selectedSinkId, audioRef]);

  return { supported, devices, selectedSinkId, setSinkId, refresh };
}
