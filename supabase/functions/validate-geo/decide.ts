// Decisao pura de acesso geografico (etapa 141).
//
// Antes desta etapa a edge `validate-geo` nunca lia `settings.mode`: qualquer
// lista configurada era tratada como allowlist, entao escolher "blocklist" na
// tela nao mudava nada. A regra fica aqui, isolada e testavel, porque um erro
// neste ponto e invisivel (nao lanca, so libera ou barra a mais).

export type GeoMode = 'allowlist' | 'blocklist';

export type GeoVerdict =
  | 'allowed'
  | 'blocked'
  | 'not_configured'
  | 'unknown_country'
  | 'invalid_mode';

export interface GeoDecision {
  /** Decisao devolvida a quem chamou (200 quando allowed, 403 quando blocked). */
  allowed: boolean;
  /** Verdadeiro so quando o modo salvo nao e reconhecido (recusa explicita). */
  verdict: GeoVerdict;
  /** Mensagem devolvida ao cliente. */
  reason: string;
  /** Motivo gravado em `geo_access_logs` / alertas. */
  logReason: string;
}

function normalizarCodigos(lista: readonly string[]): Set<string> {
  const set = new Set<string>();
  for (const item of lista) {
    if (typeof item !== 'string') continue;
    const codigo = item.trim().toUpperCase();
    if (codigo) set.add(codigo);
  }
  return set;
}

/**
 * Decide o acesso de um pais conforme o modo salvo em `geo_settings.mode`.
 *
 * - `allowlist`: permite apenas os paises da lista configurada.
 * - `blocklist`: bloqueia apenas os paises da lista configurada.
 *
 * A lista recebida ja vem filtrada pelo modo (`restriction_type='allowed'` na
 * allowlist, `'blocked'` na blocklist), porque a coluna no banco so aceita esses
 * dois valores.
 * - modo desconhecido: recusa explicita (nunca escolhe um modo em silencio).
 * - lista vazia: nao configura nada (comportamento com lista vazia e a etapa 142).
 * - pais desconhecido: segue o comportamento anterior (nao bloqueia por falta de dado).
 */
export function decideGeoAccess(
  mode: unknown,
  countryCode: string | null | undefined,
  configuredCountries: readonly string[],
): GeoDecision {
  if (mode !== 'allowlist' && mode !== 'blocklist') {
    return {
      allowed: false,
      verdict: 'invalid_mode',
      reason: 'Modo de bloqueio geográfico inválido',
      logReason: `Invalid geo mode: ${JSON.stringify(mode)}`,
    };
  }

  const country = typeof countryCode === 'string' ? countryCode.trim().toUpperCase() : '';
  if (!country) {
    return {
      allowed: true,
      verdict: 'unknown_country',
      reason: 'Country unknown',
      logReason: 'Country unknown',
    };
  }

  const lista = normalizarCodigos(configuredCountries);
  if (lista.size === 0) {
    return {
      allowed: true,
      verdict: 'not_configured',
      reason: mode === 'allowlist' ? 'Allowlist not configured' : 'Blocklist not configured',
      logReason: 'Country list not configured',
    };
  }

  const listado = lista.has(country);

  if (mode === 'allowlist') {
    return listado
      ? {
          allowed: true,
          verdict: 'allowed',
          reason: 'País na allowlist',
          logReason: 'Country in allowlist',
        }
      : {
          allowed: false,
          verdict: 'blocked',
          reason: 'País não permitido',
          logReason: 'Country not in allowlist',
        };
  }

  return listado
    ? {
        allowed: false,
        verdict: 'blocked',
        reason: 'País não permitido',
        logReason: 'Country in blocklist',
      }
    : {
        allowed: true,
        verdict: 'allowed',
        reason: 'País fora da blocklist',
        logReason: 'Country not in blocklist',
      };
}