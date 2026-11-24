import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Transição de entrada das páginas, em CSS puro.
 *
 * O `key` por `pathname` remonta o wrapper a cada troca de rota e reinicia a
 * animação `.page-enter` (`src/index.css`), com os mesmos parâmetros visuais da
 * versão em `framer-motion`: 0,35 s, cubic-bezier(0.25, 0.1, 0.25, 1), saindo de
 * opacidade 0 / y 12px / escala 0,995 / blur 4px. A biblioteca saiu do chunk de
 * entrada (etapa 251) e segue sendo carregada apenas pelas rotas lazy que a usam.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-enter flex-1">
      {children}
    </div>
  );
}
