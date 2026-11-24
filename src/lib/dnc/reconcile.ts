/**
 * Conferencia de uma importacao de DNC contra o que esta de fato em `dnc_list`.
 *
 * A comparacao usa `normalizeBrPhone` (forma canonica +55DDNNNNNNNNN) para que
 * "11999990001" e "5511999990001" sejam reconhecidos como o mesmo numero, e cai
 * para digitos puros em numeros que nao sejam BR. Comparar mal aqui faria o app
 * reimportar numero que ja esta na lista, criando linha duplicada em `phone_normalized`.
 */
import { normalizeBrPhone } from '@/lib/phone-normalization';
export interface ReconciliacaoDNC {
  presentes: string[];
  ausentes: string[];
  invalidos: string[];
}

const MIN_DIGITOS = 8;
const LOTE_CONSULTA = 200;

export function normalizarTelefone(telefone: string): string {
  const digitos = (telefone ?? '').replace(/\D/g, '');
  if (digitos.length === 0) return '';
  return normalizeBrPhone(digitos) ?? digitos;
}

export function reconciliarDNC(
  arquivo: string[],
  normalizadosNaLista: Array<string | null | undefined>,
): ReconciliacaoDNC {
  const naLista = new Set(
    normalizadosNaLista
      .map((n) => normalizarTelefone(n ?? ''))
      .filter((n) => n.length > 0),
  );

  const vistos = new Set<string>();
  const resultado: ReconciliacaoDNC = { presentes: [], ausentes: [], invalidos: [] };

  for (const bruto of arquivo) {
    const numero = normalizarTelefone(bruto);
    if (numero.length < MIN_DIGITOS) {
      resultado.invalidos.push(bruto.trim());
      continue;
    }
    if (vistos.has(numero)) continue;
    vistos.add(numero);
    if (naLista.has(numero)) resultado.presentes.push(bruto.trim());
    else resultado.ausentes.push(bruto.trim());
  }

  return resultado;
}

/** Lotes para o `.in()` do PostgREST, que tem limite de tamanho de URL. */
export function lotesParaConsulta(numeros: string[], tamanho: number = LOTE_CONSULTA): string[][] {
  const lotes: string[][] = [];
  for (let i = 0; i < numeros.length; i += tamanho) {
    lotes.push(numeros.slice(i, i + tamanho));
  }
  return lotes;
}
