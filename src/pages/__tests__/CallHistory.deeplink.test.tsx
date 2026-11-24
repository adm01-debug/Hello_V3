import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CallHistory from "../CallHistory";

const state = vi.hoisted(() => ({
  sessions: [] as Array<Record<string, unknown>>,
  handleSessionClick: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: vi.fn() }));
vi.mock("@/hooks/useCallHistory", () => ({
  useCallHistory: () => ({
    sessions: state.sessions,
    isLoading: false,
    error: null,
    searchQuery: "",
    setSearchQuery: vi.fn(),
    selectedSession: null,
    setSelectedSession: vi.fn(),
    sessionTranscripts: [],
    sessionAnalyses: [],
    sessionSummary: null,
    isLoadingDetails: false,
    showFilters: false,
    setShowFilters: vi.fn(),
    dateRangePreset: "all",
    setDateRangePreset: vi.fn(),
    customDateFrom: undefined,
    setCustomDateFrom: vi.fn(),
    customDateTo: undefined,
    setCustomDateTo: vi.fn(),
    sentimentFilter: "all",
    setSentimentFilter: vi.fn(),
    durationFilter: "all",
    setDurationFilter: vi.fn(),
    statusFilter: "all",
    setStatusFilter: vi.fn(),
    topicFilter: "",
    setTopicFilter: vi.fn(),
    allTopics: [],
    activeFiltersCount: 0,
    clearFilters: vi.fn(),
    handleSessionClick: state.handleSessionClick,
    exportTranscript: vi.fn(),
    fetchSessions: vi.fn(),
    loadMore: vi.fn(),
    hasMore: false,
  }),
}));

const renderPage = (x: string) => render(
  <MemoryRouter initialEntries={[x]}><CallHistory /></MemoryRouter>,
);

describe("CallHistory - deep link dos acertos (etapa 157)", () => {
  beforeEach(() => {
    state.sessions = [];
    state.handleSessionClick.mockClear();
  });

  it("sem o parametro session nao abre nenhuma chamada", async () => {
    renderPage("/history");
    await waitFor(() => expect(state.handleSessionClick).not.toHaveBeenCalled());
  });

  it("com ?session=<id> abre a chamada correspondente", async () => {
    state.sessions = [
      { id: "s1", status: "completed" },
      { id: "s2", status: "completed" },
    ];
    renderPage("/history?session=s2");
    await waitFor(() => expect(state.handleSessionClick).toHaveBeenCalledTimes(1));
    expect(state.handleSessionClick.mock.calls[0][0]).toMatchObject({ id: "s2" });
  });

  it("nao repete a abertura quando a lista e re-renderizada", async () => {
    state.sessions = [{ id: "s1", status: "completed" }];
    const { rerender } = render(
      <MemoryRouter initialEntries={["/history?session=s1"]}><CallHistory /></MemoryRouter>,
    );
    await waitFor(() => expect(state.handleSessionClick).toHaveBeenCalledTimes(1));
    rerender(<MemoryRouter initialEntries={["/history?session=s1"]}><CallHistory /></MemoryRouter>);
    await waitFor(() => expect(state.handleSessionClick).toHaveBeenCalledTimes(1));
  });
});