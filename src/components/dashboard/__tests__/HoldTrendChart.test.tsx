import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const { warnMock, fromMock, resultados } = vi.hoisted(() => ({
  warnMock: vi.fn(),
  fromMock: vi.fn(),
  resultados: {} as Record<string, { data: unknown; error: { message: string } | null }>,
}));

vi.mock("@/lib/logger", () => ({
  logger: { create: () => ({ warn: warnMock, error: vi.fn(), info: vi.fn(), debug: vi.fn() }) },
}));

vi.mock("@/integrations/supabase/client", () => {
  const canal: Record<string, unknown> = {};
  canal.on = () => canal;
  canal.subscribe = () => canal;
  return {
    supabase: {
      from: (tabela: string) => fromMock(tabela),
      channel: () => canal,
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: unknown }) => <div>{children as never}</div>,
  AreaChart: ({ data }: { children?: unknown; data?: unknown }) => (
    <div data-testid="area-chart" data-points={JSON.stringify(data)} />
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import { HoldTrendChart } from "@/components/dashboard/HoldTrendChart";

function consulta(resultado: { data: unknown; error: { message: string } | null }) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.is = () => builder;
  builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(resultado).then(resolve, reject);
  return builder;
}

beforeEach(() => {
  warnMock.mockClear();
  fromMock.mockReset();
  resultados.call_sessions = { data: [], error: null };
  resultados.hold_events = { data: [], error: null };
  fromMock.mockImplementation((tabela: string) => consulta(resultados[tabela] ?? { data: [], error: null }));
});

describe("HoldTrendChart", () => {
  it("mostra o erro quando a consulta falha em vez de grafico zerado", async () => {
    resultados.call_sessions = { data: null, error: { message: "permission denied for table call_sessions" } };
    render(<HoldTrendChart />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("permission denied for table call_sessions");
    expect(screen.queryByTestId("area-chart")).toBeNull();
    expect(screen.queryByText("Coletando dados...")).toBeNull();
  });

  it("aplica piso 0 e avisa no log quando ha mais holds que chamadas ativas", async () => {
    resultados.call_sessions = { data: [{ id: "s1" }], error: null };
    resultados.hold_events = { data: [{ call_session_id: "s1" }, { call_session_id: "s2" }], error: null };

    vi.useFakeTimers();
    try {
      render(<HoldTrendChart />);
      // duas coletas: a inicial e a do polling de 10s, o minimo para o grafico aparecer
      await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    } finally {
      vi.useRealTimers();
    }

    expect(warnMock.mock.calls[0][0]).toContain("holds abertos (2) maior que chamadas ativas (1)");

    const grafico = screen.getByTestId("area-chart");
    const pontos = JSON.parse(grafico.getAttribute("data-points") ?? "[]") as Array<{ inCall: number; onHold: number }>;
    expect(pontos.length).toBeGreaterThanOrEqual(2);
    expect(pontos.every((p) => p.inCall >= 0)).toBe(true);
    expect(pontos[pontos.length - 1]).toMatchObject({ onHold: 2, inCall: 0 });
  });
});
