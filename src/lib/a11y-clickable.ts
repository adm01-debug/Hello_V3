import type { KeyboardEvent } from "react";

/**
 * Linhas e cartoes clicaveis precisam ser alcancaveis e ativaveis por teclado.
 * Espalhar isto no elemento entrega role, foco visivel e ativacao por Enter/Espaco
 * sem reescrever o componente.
 */
export function clickableRowProps(onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate();
      }
    },
  };
}

/** Handler pronto para onKeyDown de linhas clicaveis (ativa o onClick existente). */
export function activateOnKey(event: KeyboardEvent<HTMLElement>) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
}
