/**
 * Store mínimo do estado de navegação, alimentado pelo Suspense das rotas.
 *
 * A barra de progresso antiga usava `setTimeout(400)` no `location.pathname`:
 * era uma animação fixa que terminava antes (ou depois) do chunk lazy carregar
 * e não dizia nada sobre o progresso real. Como o app usa `<BrowserRouter>`
 * (e não um data router), `useNavigation()` do react-router não reporta nada
 * aqui — o único sinal confiável de "ainda carregando a página" é o Suspense.
 */
type Listener = () => void;

let pending = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function startNavigation() {
  pending += 1;
  emit();
}

export function finishNavigation() {
  pending = Math.max(0, pending - 1);
  emit();
}

export function isNavigating() {
  return pending > 0;
}

export function subscribeNavigation(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getServerSnapshot() {
  return false;
}