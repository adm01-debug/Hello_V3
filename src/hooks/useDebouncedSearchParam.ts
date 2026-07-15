import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface UseDebouncedSearchParamOptions {
  /** Chave usada em ?paramKey=... */
  paramKey: string;
  /** Delay em ms; 0 aplica sem timer (síncrono). Default 300. */
  delay?: number;
  /** Valor default quando o param está ausente. Default "". */
  defaultValue?: string;
}

export interface UseDebouncedSearchParamResult {
  /** Valor imediato do input (bind em <Input value=...>). */
  inputValue: string;
  /** Valor debounced — commitado na URL. Use para filtros/queries. */
  debouncedValue: string;
  /** Atualiza o input; agenda commit na URL após `delay`. */
  setValue: (v: string) => void;
  /** Limpa imediatamente (sem debounce). */
  clear: () => void;
}

/**
 * Hook reutilizável de busca com debounce sincronizado com um query param da URL.
 *
 * - Digitar rapidamente atualiza `inputValue` imediatamente e enfileira apenas
 *   um commit em `debouncedValue`/URL após `delay` ms.
 * - Limpar (string vazia) aplica imediatamente, cancelando debounce pendente.
 * - Deep-link: valor inicial vem da URL; mudanças externas na URL propagam ao input.
 * - Sem push de histórico duplicado (usa `replace: true`).
 * - Cleanup de timer em unmount evita `setState` em componente desmontado.
 */
export function useDebouncedSearchParam({
  paramKey,
  delay = 300,
  defaultValue = "",
}: UseDebouncedSearchParamOptions): UseDebouncedSearchParamResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlValue = searchParams.get(paramKey) ?? defaultValue;

  const [inputValue, setInputValue] = useState<string>(urlValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guarda a última URL escrita por nós — evita loops de sync.
  const lastWrittenRef = useRef<string>(urlValue);

  // Sync externo: URL mudou (back/forward, preset) → hidrata input.
  useEffect(() => {
    if (urlValue !== inputValue && urlValue !== lastWrittenRef.current) {
      setInputValue(urlValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlValue]);

  const commit = useCallback(
    (value: string) => {
      lastWrittenRef.current = value;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "" || value === defaultValue) next.delete(paramKey);
          else next.set(paramKey, value);
          return next;
        },
        { replace: true },
      );
    },
    [defaultValue, paramKey, setSearchParams],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setValue = useCallback(
    (v: string) => {
      setInputValue(v);
      clearTimer();
      // Limpeza (string vazia) aplica imediatamente; delay=0 idem.
      if (v === "" || delay <= 0) {
        commit(v);
        return;
      }
      timerRef.current = setTimeout(() => {
        commit(v);
        timerRef.current = null;
      }, delay);
    },
    [clearTimer, commit, delay],
  );

  const clear = useCallback(() => {
    clearTimer();
    setInputValue(defaultValue);
    commit(defaultValue);
  }, [clearTimer, commit, defaultValue]);

  // Cleanup em unmount.
  useEffect(() => clearTimer, [clearTimer]);

  return { inputValue, debouncedValue: urlValue, setValue, clear };
}
