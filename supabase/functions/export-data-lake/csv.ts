/**
 * Serializa linhas para CSV.
 *
 * A versao anterior usava as chaves de `rows[0]` como cabecalho: se uma
 * linha seguinte trouxesse uma coluna que a primeira nao tinha, esse dado
 * era descartado em silencio — inaceitavel numa exportacao de LGPD, onde
 * o arquivo e a resposta legal ao titular. Aqui o cabecalho e a uniao de
 * todas as chaves, preservando a ordem de primeira aparicao.
 */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';

  const headers: string[] = [];
  const vistos = new Set<string>();
  for (const row of rows) {
    for (const chave of Object.keys(row)) {
      if (!vistos.has(chave)) {
        vistos.add(chave);
        headers.push(chave);
      }
    }
  }

  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    // Aspas, virgula, quebra de linha e CR precisam de escape, senao o
    // parser do destinatario ve colunas/linhas a mais.
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(',')),
  ].join('\n');
}
