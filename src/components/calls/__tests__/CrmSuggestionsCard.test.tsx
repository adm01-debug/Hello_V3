import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const estado = vi.hoisted(() => ({
  pending: [] as Array<Record<string, unknown>>,
  isLoading: false,
  error: null as Error | null,
}));

vi.mock("@/hooks/useCrmFieldSuggestions", () => ({
  useCrmFieldSuggestions: () => ({
    suggestions: estado.pending,
    pending: estado.pending,
    isLoading: estado.isLoading,
    error: estado.error,
    accept: vi.fn(),
    reject: vi.fn(),
    triggerExtraction: vi.fn(),
  }),
}));

import { CrmSuggestionsCard } from "@/components/calls/CrmSuggestionsCard";

beforeEach(() => {
  estado.pending = [];
  estado.isLoading = false;
  estado.error = null;
});

describe("CrmSuggestionsCard", () => {
  it("explica o vazio em vez de sumir da tela", () => {
    render(<CrmSuggestionsCard callSessionId="s1" />);
    expect(screen.getByText("Nenhum campo de CRM identificado nesta chamada.")).toBeInTheDocument();
  });

  it("mostra carregando enquanto a consulta roda", () => {
    estado.isLoading = true;
    render(<CrmSuggestionsCard callSessionId="s1" />);
    expect(screen.getByText("Buscando sugestões de CRM...")).toBeInTheDocument();
  });

  it("mostra o erro da consulta", () => {
    estado.error = new Error("permission denied for table crm_field_suggestions");
    render(<CrmSuggestionsCard callSessionId="s1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("permission denied for table crm_field_suggestions");
  });

  it("lista a sugestao pendente com o rotulo do campo", () => {
    estado.pending = [
      {
        id: "c1",
        call_session_id: "s1",
        contact_id: "ct1",
        field_name: "pain_point",
        current_value: null,
        suggested_value: "Perde vendas por falta de follow-up",
        confidence: 0.9,
        source_quote: "a gente perde muito por nao retornar",
        status: "pending",
      },
    ];
    render(<CrmSuggestionsCard callSessionId="s1" />);
    expect(screen.getByText("Dor / Problema")).toBeInTheDocument();
    expect(screen.getByText("Perde vendas por falta de follow-up")).toBeInTheDocument();
  });
});
