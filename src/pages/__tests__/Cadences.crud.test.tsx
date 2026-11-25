import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Cadences from "../Cadences";

const state = vi.hoisted(() => ({
  updateCadence: vi.fn(async () => true),
  deleteCadence: vi.fn(async () => true),
  updateStep: vi.fn(async () => true),
  deleteStep: vi.fn(async () => true),
  enrollContact: vi.fn(async () => true),
  updateEnrollmentStatus: vi.fn(async () => true),
  refreshEnrollments: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: vi.fn() }));
vi.mock("@/hooks/useCadences", () => ({
  useCadences: () => ({
    cadences: [
      { id: "c1", name: "Renovacao", description: "desc", is_active: true, version: 2, created_at: "", updated_at: "" },
    ],
    steps: [
      { id: "s1", cadence_id: "c1", step_order: 1, step_type: "call", delay_days: 0, delay_hours: 0, subject: null, body: null },
    ],
    loading: false,
    totalCount: 1,
    hasMore: false,
    loadingMore: false,
    loadMore: vi.fn(),
    createCadence: vi.fn(async () => null),
    addStep: vi.fn(async () => true),
    updateCadence: state.updateCadence,
    deleteCadence: state.deleteCadence,
    updateStep: state.updateStep,
    deleteStep: state.deleteStep,
    enrollContact: state.enrollContact,
  }),
  useCadenceEnrollments: () => ({
    enrollments: [
      { id: "e1", cadence_id: "c1", contact_id: "ct1", deal_id: null, agent_name: "Ana", current_step: 0, status: "active", next_action_at: "2026-11-25T10:00:00Z" },
    ],
    loading: false,
    refresh: state.refreshEnrollments,
    updateEnrollmentStatus: state.updateEnrollmentStatus,
  }),
}));
vi.mock("@/hooks/useContacts", () => ({
  useContacts: () => ({
    contacts: [
      { id: "ct1", name: "Maria Silva", phone: "11999990000", email: "maria@x.com" },
      { id: "ct2", name: "Joao Souza", phone: "11888887777", email: "joao@x.com" },
    ],
    isLoading: false,
  }),
}));
vi.mock("@/hooks/useAgentStatus", () => ({
  useAgentStatus: () => ({ currentAgent: { id: "a1", name: "Ana" }, agents: [], isLoading: false }),
}));

const renderPage = () => render(<MemoryRouter><Cadences /></MemoryRouter>);

describe("Cadences: acoes de edicao e exclusao na tela", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.updateCadence.mockResolvedValue(true);
    state.deleteCadence.mockResolvedValue(true);
    state.updateStep.mockResolvedValue(true);
    state.deleteStep.mockResolvedValue(true);
  });

  it("mostra os controles de editar, ativar/desativar e excluir na cadencia", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /^Editar cad/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Desativar cad/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Excluir cad/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Editar passo/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Excluir passo/ })).toBeTruthy();
  });

  it("desativar a cadencia grava is_active=false pelo id", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Desativar cad/ }));
    await waitFor(() => expect(state.updateCadence).toHaveBeenCalledWith("c1", { is_active: false }));
  });

  it("salvar o dialogo de edicao envia nome e descricao", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Editar cad/ }));
    const nameInput = await screen.findByDisplayValue("Renovacao");
    fireEvent.change(nameInput, { target: { value: "Renovacao 2" } });
    fireEvent.click(screen.getByRole("button", { name: /^Salvar$/ }));
    await waitFor(() =>
      expect(state.updateCadence).toHaveBeenCalledWith("c1", { name: "Renovacao 2", description: "desc" }),
    );
  });

  it("confirmar a exclusao da cadencia chama deleteCadence", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Excluir cad/ }));
    const confirm = await screen.findByRole("button", { name: /^Excluir$/ });
    fireEvent.click(confirm);
    await waitFor(() => expect(state.deleteCadence).toHaveBeenCalledWith("c1"));
  });

  it("excluir um passo pede confirmacao e chama deleteStep", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Excluir passo/ }));
    const confirm = await screen.findByRole("button", { name: /^Excluir$/ });
    fireEvent.click(confirm);
    await waitFor(() => expect(state.deleteStep).toHaveBeenCalledWith("s1"));
  });

  it("lista os inscritos da cadencia com nome do contato", () => {
    renderPage();
    expect(screen.getByText("Inscritos (1)")).toBeTruthy();
    expect(screen.getByText("Maria Silva")).toBeTruthy();
  });

  it("inscrever um contato envia cadencia, contato e agente logado", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Inscrever contato/ }));
    const option = await screen.findByText("Joao Souza");
    fireEvent.click(option);
    await waitFor(() => expect(state.enrollContact).toHaveBeenCalledWith("c1", "ct2", "Ana"));
    await waitFor(() => expect(state.refreshEnrollments).toHaveBeenCalled());
  });

  it("nao deixa inscrever de novo um contato que ja esta na cadencia", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Inscrever contato/ }));
    const already = await screen.findByRole("button", { name: /Maria Silva.*Já inscrito/ });
    expect((already as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText("Já inscrito").length).toBe(1);
  });

  it("pausar um inscrito chama updateEnrollmentStatus com paused", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Pausar inscrição" }));
    await waitFor(() => expect(state.updateEnrollmentStatus).toHaveBeenCalledWith("e1", "paused"));
  });

  it("cancelar um inscrito chama updateEnrollmentStatus com cancelled", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar inscrição" }));
    await waitFor(() => expect(state.updateEnrollmentStatus).toHaveBeenCalledWith("e1", "cancelled"));
  });
});