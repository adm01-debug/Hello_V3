import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import fc from "fast-check";
import type { ReactNode } from "react";
import { useDebouncedSearchParam } from "../useDebouncedSearchParam";

function wrapper(initial = "/") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>;
  };
}

describe("useDebouncedSearchParam", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("hidrata a partir da URL", () => {
    const { result } = renderHook(
      () => useDebouncedSearchParam({ paramKey: "q" }),
      { wrapper: wrapper("/?q=alpha") },
    );
    expect(result.current.inputValue).toBe("alpha");
    expect(result.current.debouncedValue).toBe("alpha");
  });

  it("debounce: uma rajada de setValue commita apenas uma vez", () => {
    const { result } = renderHook(
      () => useDebouncedSearchParam({ paramKey: "q", delay: 300 }),
      { wrapper: wrapper() },
    );
    act(() => {
      result.current.setValue("a");
      result.current.setValue("ab");
      result.current.setValue("abc");
    });
    // Antes do timer: input já reflete, mas debouncedValue (URL) ainda é ""
    expect(result.current.inputValue).toBe("abc");
    expect(result.current.debouncedValue).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedValue).toBe("abc");
  });

  it("string vazia aplica imediatamente (bypass debounce)", () => {
    const { result } = renderHook(
      () => useDebouncedSearchParam({ paramKey: "q", delay: 300 }),
      { wrapper: wrapper("/?q=hello") },
    );
    act(() => result.current.setValue(""));
    expect(result.current.debouncedValue).toBe("");
    expect(result.current.inputValue).toBe("");
  });

  it("clear() cancela debounce pendente", () => {
    const { result } = renderHook(
      () => useDebouncedSearchParam({ paramKey: "q", delay: 300 }),
      { wrapper: wrapper() },
    );
    act(() => result.current.setValue("pending"));
    act(() => result.current.clear());
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.debouncedValue).toBe("");
    expect(result.current.inputValue).toBe("");
  });

  it("delay=0 comporta-se como controlled síncrono", () => {
    const { result } = renderHook(
      () => useDebouncedSearchParam({ paramKey: "q", delay: 0 }),
      { wrapper: wrapper() },
    );
    act(() => result.current.setValue("x"));
    expect(result.current.debouncedValue).toBe("x");
  });

  it("unmount durante debounce não vaza timer", () => {
    const clearSpy = vi.spyOn(global, "clearTimeout");
    const { result, unmount } = renderHook(
      () => useDebouncedSearchParam({ paramKey: "q", delay: 300 }),
      { wrapper: wrapper() },
    );
    act(() => result.current.setValue("abc"));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("caracteres especiais são preservados", () => {
    const { result } = renderHook(
      () => useDebouncedSearchParam({ paramKey: "q", delay: 100 }),
      { wrapper: wrapper() },
    );
    const special = "50% (foo, bar)";
    act(() => result.current.setValue(special));
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.debouncedValue).toBe(special);
  });

  it("PBT: sequência aleatória converge para o último valor", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 30 }),
        (seq) => {
          const { result, unmount } = renderHook(
            () => useDebouncedSearchParam({ paramKey: "q", delay: 50 }),
            { wrapper: wrapper() },
          );
          for (const s of seq) {
            act(() => result.current.setValue(s));
          }
          act(() => vi.advanceTimersByTime(100));
          const last = seq[seq.length - 1];
          expect(result.current.debouncedValue).toBe(last);
          unmount();
        },
      ),
      { numRuns: 200 },
    );
  });
});
