import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "../search-input";

describe("SearchInput", () => {
  it("renderiza com placeholder e valor", () => {
    render(<SearchInput value="foo" onValueChange={() => {}} placeholder="Buscar..." />);
    expect(screen.getByRole("searchbox")).toHaveValue("foo");
  });

  it("chama onValueChange a cada tecla", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onValueChange={onChange} placeholder="q" />);
    await user.type(screen.getByRole("searchbox"), "ab");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, "a");
    expect(onChange).toHaveBeenNthCalledWith(2, "b");
  });

  it("mostra botão limpar somente quando há valor", () => {
    const { rerender } = render(<SearchInput value="" onValueChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /limpar busca/i })).toBeNull();
    rerender(<SearchInput value="x" onValueChange={() => {}} />);
    expect(screen.getByRole("button", { name: /limpar busca/i })).toBeInTheDocument();
  });

  it("botão limpar chama onValueChange('')", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="abc" onValueChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /limpar busca/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("Esc limpa quando há valor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="abc" onValueChange={onChange} />);
    screen.getByRole("searchbox").focus();
    await user.keyboard("{Escape}");
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("onClear customizado sobrescreve default", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onChange = vi.fn();
    render(<SearchInput value="x" onValueChange={onChange} onClear={onClear} />);
    await user.click(screen.getByRole("button", { name: /limpar busca/i }));
    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disabled esconde botão limpar", () => {
    render(<SearchInput value="x" onValueChange={() => {}} disabled />);
    expect(screen.queryByRole("button", { name: /limpar busca/i })).toBeNull();
  });
});
