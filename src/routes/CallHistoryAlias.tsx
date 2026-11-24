import { Navigate, useLocation } from "react-router-dom";

/**
 * Alias de `/history` (etapa 266). Redireciona com `replace` preservando a
 * query string, porque `CallLibrary.tsx` monta links `/call-history?session=...`.
 */
export function CallHistoryAlias() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/history", search }} replace />;
}
