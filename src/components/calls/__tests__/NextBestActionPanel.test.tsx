import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const estado = vi.hoisted(() => ({
  signals: [] as Array<Record<string, unknown>>,
  isLoading: false,
  error: null as Error | null,
  markUsed: vi.fn(),
}));

vi.mock("@/hooks/useLiveAssist", () => ({
  useLiveAssist: () => ({
    signals: estado.signals,
    isLoading: estado.isLoading,
    error: estado.error,
    isAnalyzing: false,
    analyze: vi.fn(),
    markUsed: estado.markUsed,
  }),
}));

import { NextBestActionPanel } from "@/components/calls/NextBestActionPanel";

beforeEach(() => {
  estado.signals = [];
  estado.isLoading = false;
  estado.error = null;
  estado.markUsed.mockClear();
});

describe("NextBestActionPanel", () => {
  it("mostra o erro da consulta em vez de um painel vazio", () => {
    estado.error = new Error("relation agent_assist_signals does not exist");
    render(<NextBestActionPanel callSessionId="s1" />);

    expect(screen.getByRole("alert")).toHaveTextContent("relation agent_assist_signals does not exist");
    expect(screen.queryByText("Aguardando análise da conversa...")).toBeNull();
  });

  it("distingue carregando de sem sugestao", () => {
    estado.isLoading = true;
    const { unmount } = render(<NextBestActionPanel callSessionId="s1" />);
    expect(screen.getByText("Aguardando análise da conversa...")).toBeInTheDocument();
    unmount();

    estado.isLoading = false;
    render(<NextBestActionPanel callSessionId="s1" />);
    expect(screen.getByText("Nenhuma sugestão para esta conversa até agora.")).toBeInTheDocument();
  });

  it("lista o sinal e marca como usado", () => {
    estado.signals = [
      {
        id: "sig-1",
        call_session_id: "s1",
        intent: "buying_signal",
        confidence: 0.8,
        suggestion: "Confirmar fechamento na sexta",
        trigger_text: "pode mandar o contrato",
        was_used: false,
        metadata: { severity: "info" },
      },
    ];
    render(<NextBestActionPanel callSessionId="s1" />);

    expect(screen.getByText("Confirmar fechamento na sexta")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Usei essa sugestão"));
    expect(estado.markUsed).toHaveBeenCalledWith("sig-1");
  });

  it("ignorar nao registra a sugestao como usada (A-212)", () => {
    estado.signals = [
      {
        id: "sig-2",
        call_session_id: "s1",
        intent: "objection",
        confidence: 0.5,
        suggestion: "Contornar a objeção de preço",
        trigger_text: "está caro",
        was_used: false,
        metadata: { severity: "warning" },
      },
    ];
    render(<NextBestActionPanel callSessionId="s1" />);

    fireEvent.click(screen.getByTitle("Ignorar"));

    expect(estado.markUsed).not.toHaveBeenCalled();
    expect(screen.queryByText("Contornar a objeção de preço")).toBeNull();
    expect(screen.getByText("Nenhuma sugestão para esta conversa até agora.")).toBeInTheDocument();
  });
});
