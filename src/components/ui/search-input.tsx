import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, "onChange" | "value"> {
  /** Valor imediato do input (bind ao estado do usuário). */
  value: string;
  /** Handler de mudança — recebe a nova string diretamente. */
  onValueChange: (value: string) => void;
  /** Texto do placeholder. */
  placeholder?: string;
  /** Label acessível se não houver <label> associado. */
  ariaLabel?: string;
  /** Callback opcional ao limpar (Escape ou botão). Default: onValueChange(""). */
  onClear?: () => void;
  /** Classes do wrapper. */
  wrapperClassName?: string;
}

/**
 * Campo de busca unificado com ícone, botão "limpar" e suporte a tecla Esc.
 *
 * Cenários cobertos:
 * - Rajada de digitação: repassa a cada tecla ao pai (que aplica debounce).
 * - Limpar via botão ou Esc: chama onClear (ou onValueChange("")).
 * - Acessibilidade: role="searchbox", aria-label, botão limpar com aria-label.
 * - Caracteres especiais / IME: preserva `value` sem sanitizar.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onValueChange,
      onClear,
      placeholder = "Buscar...",
      ariaLabel,
      className,
      wrapperClassName,
      disabled,
      ...rest
    },
    ref,
  ) {
    const handleClear = () => {
      if (onClear) onClear();
      else onValueChange("");
    };

    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={ref}
          type="search"
          role="searchbox"
          aria-label={ariaLabel ?? placeholder}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              handleClear();
            }
          }}
          className={cn("pl-9", value ? "pr-9" : "pr-3", className)}
          {...rest}
        />
        {value && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Limpar busca"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    );
  },
);
