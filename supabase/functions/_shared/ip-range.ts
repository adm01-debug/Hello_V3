/**
 * Casamento de IP contra uma faixa CIDR.
 *
 * Antes, validar um acesso chamava o RPC `check_ip_in_cidr` dentro de um laco:
 * o custo era uma ida ao banco por faixa cadastrada, no caminho que libera o
 * acesso. O operador de rede do Postgres (`<<=`) nao esta exposto no PostgREST,
 * entao a lista e lida numa unica consulta e o casamento acontece aqui.
 *
 * A semantica tem que ser a mesma do banco, senao a autorizacao muda de
 * resultado: familia diferente nunca casa (IPv4 nao casa com faixa IPv6 nem com
 * endereco IPv4-mapeado, como no `inet`), os dois lados sao mascarados pelo
 * prefixo da faixa, e valor invalido casa com nada em vez de estourar (o RPC
 * devolvia false no EXCEPTION).
 */

const IPV4_BYTES = 4;
const IPV6_BYTES = 16;

function parseIpv4(valor: string): Uint8Array | null {
  const partes = valor.split('.');
  if (partes.length !== 4) return null;
  const bytes = new Uint8Array(IPV4_BYTES);
  for (let i = 0; i < 4; i += 1) {
    if (!/^\d{1,3}$/.test(partes[i])) return null;
    const octeto = Number(partes[i]);
    if (octeto > 255) return null;
    bytes[i] = octeto;
  }
  return bytes;
}

function parseIpv6(valor: string): Uint8Array | null {
  const semZona = valor.split('%')[0];
  const duplo = semZona.indexOf('::');
  if (duplo !== -1 && semZona.indexOf('::', duplo + 1) !== -1) return null;
  const esquerda = duplo === -1 ? semZona : semZona.slice(0, duplo);
  const direita = duplo === -1 ? '' : semZona.slice(duplo + 2);

  const paraGrupos = (bloco: string): number[] | null => {
    if (!bloco) return [];
    const grupos = bloco.split(':');
    const saida: number[] = [];
    for (let i = 0; i < grupos.length; i += 1) {
      const grupo = grupos[i];
      if (grupo.includes('.')) {
        // IPv4 embutido (`::ffff:192.0.2.1`): so pode ser o ultimo e vale dois grupos.
        if (i !== grupos.length - 1) return null;
        const v4 = parseIpv4(grupo);
        if (!v4) return null;
        saida.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]);
        continue;
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(grupo)) return null;
      saida.push(parseInt(grupo, 16));
    }
    return saida;
  };

  const esquerdaGrupos = paraGrupos(esquerda);
  const direitaGrupos = paraGrupos(direita);
  if (!esquerdaGrupos || !direitaGrupos) return null;
  const informados = esquerdaGrupos.length + direitaGrupos.length;
  let grupos: number[];
  if (duplo === -1) {
    if (informados !== 8) return null;
    grupos = esquerdaGrupos;
  } else {
    // `::` representa no minimo um grupo zerado.
    if (informados > 7) return null;
    grupos = [...esquerdaGrupos, ...new Array(8 - informados).fill(0), ...direitaGrupos];
  }
  const bytes = new Uint8Array(IPV6_BYTES);
  grupos.forEach((grupo, indice) => {
    bytes[indice * 2] = (grupo >> 8) & 0xff;
    bytes[indice * 2 + 1] = grupo & 0xff;
  });
  return bytes;
}

function parseEndereco(valor: string): Uint8Array | null {
  const bruto = valor.trim();
  if (!bruto) return null;
  return bruto.includes(':') ? parseIpv6(bruto) : parseIpv4(bruto);
}

/** O IP esta dentro da faixa? Aceita endereco puro (tratado como /32 ou /128). */
export function ipMatchesRange(ip: string, faixa: string): boolean {
  const endereco = parseEndereco(ip);
  if (!endereco) return false;
  const partes = faixa.trim().split('/');
  if (partes.length > 2) return false;
  const rede = parseEndereco(partes[0]);
  if (!rede) return false;
  if (rede.length !== endereco.length) return false;
  const maximo = rede.length * 8;
  let prefixo = maximo;
  if (partes.length === 2) {
    if (!/^\d{1,3}$/.test(partes[1])) return false;
    prefixo = Number(partes[1]);
    if (prefixo > maximo) return false;
  }
  const octetosCheios = Math.floor(prefixo / 8);
  for (let i = 0; i < octetosCheios; i += 1) {
    if (endereco[i] !== rede[i]) return false;
  }
  const bitsRestantes = prefixo % 8;
  if (bitsRestantes === 0) return true;
  const mascara = (0xff << (8 - bitsRestantes)) & 0xff;
  return (endereco[octetosCheios] & mascara) === (rede[octetosCheios] & mascara);
}

export interface WhitelistEntry {
  ip_address: string;
  is_cidr?: boolean | null;
}

/**
 * Uma passada pela lista ja lida: nenhuma ida ao banco por faixa, que era o N+1
 * da validacao de IP. `is_cidr` nao e consultado porque o prefixo diz tudo.
 */
export function ipMatchesAny(
  ip: string | null,
  entradas: readonly WhitelistEntry[] | null | undefined,
): boolean {
  if (!ip || !entradas || entradas.length === 0) return false;
  return entradas.some((entrada) => ipMatchesRange(ip, entrada.ip_address));
}