import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useRef } from "react";

import { ActiveCallDisplay } from "../ActiveCallDisplay";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { CallSession } from "@/hooks/useMultiChannelCall";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/hooks/useVoiceCommand", () => ({
  useVoiceCommand: () => ({
    isListening: false,
    isProcessing: false,
    lastCommand: null,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  }),
}));
vi.mock("@/hooks/useLiveSentiment", () => ({ useLiveSentiment: () => ({ snapshots: [] }) }));
vi.mock("../../VoipQualityIndicator", () => ({ VoipQualityIndicator: () => null }));
vi.mock("../../TransferCallDialog", () => ({ TransferCallDialog: () => null }));

const call = {
  id: "call-1",
  dbSessionId: "sess-1",
  status: "active",
  direction: "outbound",
  phoneNumber: "+5511999999999",
  contactName: "Cliente",
  channel: "sip",
  transcripts: [],
  duration: 0,
} as unknown as CallSession;

function renderCall(channel: "sip" | "webrtc") {
  const sinkCalls: string[] = [];

  function Harness() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    return (
      <>
        <audio ref={audioRef} aria-label="Áudio remoto da chamada" data-testid="audio-remoto" />
        <ActiveCallDisplay
          currentCall={call}
          activeChannel={channel}
          channelName="SIP"
          isSpeaking={false}
          volume={1}
          onMuteToggle={vi.fn()}
          onHoldToggle={vi.fn()}
          onVolumeToggle={vi.fn()}
          onRecordToggle={vi.fn()}
          onEndCall={vi.fn()}
          onTransferCall={vi.fn()}
          onCompleteTransfer={vi.fn()}
          onCancelTransfer={vi.fn()}
          pc={null}
          remoteAudioRef={audioRef}
        />
      </>
    );
  }

  render(
    <TooltipProvider>
      <Harness />
    </TooltipProvider>,
  );
  return { sinkCalls };
}

beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "setSinkId", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(function (this: HTMLAudioElement, id: string) {
      (this as unknown as { __sink?: string }).__sink = id;
      return Promise.resolve();
    }),
  });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: "audiooutput", deviceId: "default", label: "Fone do notebook" },
        { kind: "audiooutput", deviceId: "spk-1", label: "Alto-falante USB" },
      ]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
});

afterEach(() => {
  delete (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId;
});

describe("ActiveCallDisplay — saída de áudio da chamada", () => {
  it("oferece a escolha de saída na chamada SIP e aplica o sink no áudio remoto", async () => {
    renderCall("sip");

    const combo = await screen.findByRole("combobox", { name: /saída de áudio/i });
    expect(combo).toBeInTheDocument();

    const audio = screen.getByTestId("audio-remoto") as HTMLAudioElement & { __sink?: string };
    await waitFor(() => expect(audio.__sink).toBe("default"));
  });

  it("não mostra o seletor fora da chamada SIP", async () => {
    renderCall("webrtc");
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole("combobox", { name: /saída de áudio/i })).not.toBeInTheDocument();
  });

  it("não mostra o seletor quando o navegador não suporta trocar a saída", async () => {
    delete (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId;
    renderCall("sip");

    await waitFor(() =>
      expect(screen.queryByRole("combobox", { name: /saída de áudio/i })).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(/não suportada neste navegador/i)).not.toBeInTheDocument();
  });
});