import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportDNCDialog } from "@/components/compliance/dnc/ImportDNCDialog";
import type { DNCBulkImportResult } from "@/hooks/useDNCCompliance";

function setup(onImport: () => Promise<DNCBulkImportResult>) {
  render(<ImportDNCDialog onImport={onImport} />);
  fireEvent.click(screen.getByRole("button", { name: /^importar$/i }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "11999990001\n11999990002" } });
  const botoes = screen.getAllByRole("button", { name: /^importar$/i });
  fireEvent.click(botoes[botoes.length - 1]);
}

describe("ImportDNCDialog", () => {
  it("fecha o dialogo quando tudo foi importado", async () => {
    const onImport = vi.fn().mockResolvedValue({ success: 2, failed: 0, duplicates: 0 });
    setup(onImport);
    await waitFor(() => expect(onImport).toHaveBeenCalledWith(["11999990001", "11999990002"], "import"));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });

  it("mantem o dialogo aberto e mostra as falhas", async () => {
    const onImport = vi.fn().mockResolvedValue({ success: 1, failed: 1, duplicates: 0 });
    setup(onImport);
    expect(await screen.findByRole("status")).toHaveTextContent("1 importados, 0 duplicados, 1 falharam");
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
