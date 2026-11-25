/**
 * URL do discador (rota "/") com o numero ja preenchido.
 *
 * O audio da chamada so existe na instancia de SIP montada pelo discador, entao
 * qualquer tela que "liga" navega para la em vez de abrir um estado de chamada
 * sem audio. `autoDial` faz o discador disparar a chamada ao abrir.
 */
export function dialerUrl(
  phone: string,
  name?: string | null,
  options: { autoDial?: boolean } = {},
): string {
  const params = new URLSearchParams({ number: phone });
  if (name) params.set('nome', name);
  if (options.autoDial) params.set('auto', '1');
  return `/?${params.toString()}`;
}