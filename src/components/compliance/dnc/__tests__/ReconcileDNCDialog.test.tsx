import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { fromMock, naLista, resendMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  naLista: [] as string[],
  resendMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (tabela: string) => fromMock(tabela) },
}));

import { ReconcileDNCDialog } from "@/components/compliance/dnc/ReconcileDNCDialog";

function consulta(linhas: string[]) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.in = () => builder;
  builder.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve({ data: linhas.map((phone_normalized) => ({ phone_normalized })), error: null }).then(res, rej);
  return builder;
}

async function conferirArquivo(numeros: string) {
  fireEvent.click(screen.getByRole("button", { name: /conferir lista/i }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: numeros } });
  fireEvent.click(screen.getByRole("button", { name: /^conferir$/i }));
}

beforeEach(() => {
  naLista.length = 0;
  resendMock.mockReset();
  fromMock.mockReset();
  fromMock.mockImplementation(() => consulta(naLista));
});

describe("ReconcileDNCDialog", () => {
  it("aponta exatamente o numero ausente da lista", async () => {
    naLista.push("11999990001", "11999990003");
    render(<ReconcileDNCDialog onResend={resendMock} />);

    await conferirArquivo("11999990001\n11999990002\n11999990003");

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("2 já estão na lista, 1 ausentes");
    expect(status).toHaveTextContent("11999990002");
    expect(status).not.toHaveTextContent("11999990001");
  });

  it("reenvia apenas os ausentes e recontabiliza", async () => {
    naLista.push("11999990001");
    resendMock.mockImplementation(async (telefones: string[]) => {
      naLista.push(...telefones);
      return { success: telefones.length, failed: 0, duplicates: 0 };
    });
    render(<ReconcileDNCDialog onResend={resendMock} />);

    await conferirArquivo("11999990001\n11999990002");
    await screen.findByText(/1 ausentes/);

    fireEvent.click(screen.getByRole("button", { name: /reenviar só os ausentes/i }));

    await waitFor(() => expect(resendMock).toHaveBeenCalledWith(["11999990002"]));
    expect(await screen.findByText(/Reenvio: 1 importados, 0 duplicados, 0 falharam/)).toBeInTheDocument();
    expect(await screen.findByText(/2 já estão na lista, 0 ausentes/)).toBeInTheDocument();
  });

  it("mostra o erro da consulta em vez de dizer que esta tudo certo", async () => {
    fromMock.mockImplementation(() => {
      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      builder.in = () => builder;
      builder.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: "permission denied for table dnc_list" } }).then(res, rej);
      return builder;
    });
    render(<ReconcileDNCDialog onResend={resendMock} />);

    await conferirArquivo("11999990001");
    expect(await screen.findByRole("alert")).toHaveTextContent("permission denied for table dnc_list");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
