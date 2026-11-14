import { ViewTransition, type ReactNode } from "react";

/**
 * Transición al cambiar de página: la anterior se desvanece y la nueva sube suavemente.
 * Usa la View Transitions API del navegador (sin soporte, la página cambia normal).
 */
export function TransicionPagina({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="pagina-entra" exit="pagina-sale" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
