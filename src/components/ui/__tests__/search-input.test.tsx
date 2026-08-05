import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "../search-input";

describe("SearchInput", () => {
  it("renderiza com placeholder e valor", () => {
    render(<SearchInput value="foo" onValueChange={() => {}} placeholder="Buscar..." />);
    expect(screen.getByRole("searchbox")).toHaveValue("foo");
  });

  it("chama onValueChange ao digitar", () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onValueChange={onChange} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("mostra botão limpar somente quando há valor", () => {
    const { rerender } = render(<SearchInput value="" onValueChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /limpar busca/i })).toBeNull();
    rerender(<SearchInput value="x" onValueChange={() => {}} />);
    expect(screen.getByRole("button", { name: /limpar busca/i })).toBeInTheDocument();
  });

  it("botão limpar chama onValueChange('')", () => {
    const onChange = vi.fn();
    render(<SearchInput value="abc" onValueChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /limpar busca/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("Esc limpa quando há valor", () => {
    const onChange = vi.fn();
    render(<SearchInput value="abc" onValueChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("Esc não faz nada quando valor está vazio", () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onValueChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onClear customizado sobrescreve default", () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    render(<SearchInput value="x" onValueChange={onChange} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: /limpar busca/i }));
    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disabled esconde botão limpar", () => {
    render(<SearchInput value="x" onValueChange={() => {}} disabled />);
    expect(screen.queryByRole("button", { name: /limpar busca/i })).toBeNull();
  });
});
