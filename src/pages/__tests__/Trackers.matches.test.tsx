import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Trackers from "../Trackers";

const state = vi.hoisted(() => ({ matches: [] as Array<Record<string, unknown>> }));

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: vi.fn() }));
vi.mock("@/components/layout/NeonPageLayout", () => ({
  NeonPageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/hooks/useTrackers", () => ({
  useTrackers: () => ({
    trackers: [{
      id: "t1", name: "Concorrente", category: "competitor", description: null,
      keywords: ["acme"], match_type: "any", is_active: true, color: "primary",
    }],
    loading: false,
    refresh: vi.fn(),
    createTracker: vi.fn(),
    toggleTracker: vi.fn(),
  }),
  useTrackerMatches: () => ({ matches: state.matches, loading: false }),
}));

const renderPage = () => render(<MemoryRouter><Trackers /></MemoryRouter>);

describe("Trackers - acertos dos trackers (etapa 157)", () => {
  beforeEach(() => { state.matches = []; });

  it("mostra o estado vazio explicando que falta transcricao no periodo", () => {
    renderPage();
    expect(screen.getByText("Acertos no período (0)")).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma chamada transcrita no período/)).toBeInTheDocument();
  });

  it("lista os acertos e leva ao detalhe da chamada no historico", () => {
    state.matches = [
      { id: "m1", tracker_id: "t1", call_session_id: "s1", agent_name: "Ana", matched_keyword: "acme", quote: "citou a acme na ligacao", timestamp_seconds: 12, created_at: "2026-11-20T14:00:00.000Z" },
      { id: "m2", tracker_id: "t1", call_session_id: "s2", agent_name: null, matched_keyword: null, quote: "mencao a acme", timestamp_seconds: 30, created_at: "2026-11-21T14:00:00.000Z" },
    ];
    renderPage();

    expect(screen.getByText("Acertos no período (2)")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Agente não identificado")).toBeInTheDocument();
    expect(screen.getByText("citou a acme na ligacao")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "Abrir chamada" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/history?session=s1");
    expect(links[1]).toHaveAttribute("href", "/history?session=s2");
  });
});