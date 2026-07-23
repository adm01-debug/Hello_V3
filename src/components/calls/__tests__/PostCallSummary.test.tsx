import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PostCallSummary, type PostCallSummaryData } from "@/components/calls/PostCallSummary";
import type { VoipQualitySample } from "@/hooks/useVoipQualityMonitor";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function sample(overrides: Partial<VoipQualitySample> = {}): VoipQualitySample {
  return {
    ts: 1_700_000_000_000,
    jitterMs: 10,
    packetsLost: 1,
    packetsReceived: 99,
    packetsDiscarded: 0,
    fractionLost: 0.01,
    concealedSamples: 20,
    totalSamplesReceived: 1000,
    rttMs: 50,
    audioLevel: 0.5,
    mos: 4.2,
    ...overrides,
  };
}

function makeData(samples: VoipQualitySample[]): PostCallSummaryData {
  return {
    samples,
    durationSec: 42,
    targetNumber: "+551199999",
    channel: "webrtc",
    startedAt: 1_700_000_000_000,
    endedAt: 1_700_000_042_000,
  };
}

describe("PostCallSummary", () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  it("mostra mensagem quando não há amostras", () => {
    render(<PostCallSummary open data={makeData([])} onClose={() => {}} />);
    expect(screen.getByText(/sem amostras/i)).toBeInTheDocument();
  });

  it("agrega MOS, jitter, perda e classifica qualidade", () => {
    const data = makeData([
      sample({ mos: 4.5, jitterMs: 8, rttMs: 40, packetsLost: 1, packetsReceived: 99 }),
      sample({ mos: 4.1, jitterMs: 14, rttMs: 60, packetsLost: 2, packetsReceived: 98 }),
    ]);
    render(<PostCallSummary open data={data} onClose={() => {}} />);
    // MOS médio 4.30 → excelente
    expect(screen.getByText("4.30")).toBeInTheDocument();
    expect(screen.getByText(/excelente/i)).toBeInTheDocument();
    // Perda: 3 / (3 + 197) = 1.5%
    expect(screen.getByText("1.50%")).toBeInTheDocument();
  });

  it("classifica como Ruim quando MOS médio < 3.6", () => {
    const data = makeData([sample({ mos: 2.5 }), sample({ mos: 2.7 })]);
    render(<PostCallSummary open data={data} onClose={() => {}} />);
    expect(screen.getByText(/ruim/i)).toBeInTheDocument();
  });

  it("dispara download de CSV ao clicar em Baixar CSV", () => {
    const data = makeData([sample()]);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<PostCallSummary open data={data} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /baixar csv/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });

  it("botão Baixar CSV fica desabilitado quando não há dados", () => {
    render(<PostCallSummary open data={null} onClose={() => {}} />);
    const btn = screen.getByRole("button", { name: /baixar csv/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
