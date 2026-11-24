/**
 * Leitura em lote das notificacoes do resumo (digest).
 *
 * Antes o resumo fazia um `select` por usuario com digest habilitado: 100
 * usuarios custavam 100 idas ao banco por execucao. Agora e uma leitura por
 * lote de usuarios, com paginacao, e o recorte de cada usuario (janela dele e
 * teto de 50) acontece em memoria — o conteudo do digest e o mesmo de antes.
 *
 * A leitura e injetada (`LeitorNotificacoes`) para o agrupamento poder ser
 * testado sem rede.
 */

export interface UsuarioDigest {
  user_id: string;
  digest_frequency: string | null;
}

export interface NotificacaoResumo {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string | null;
  severity: string;
  created_at: string;
}

export type LeitorNotificacoes = (
  lote: readonly string[],
  desde: string,
  inicio: number,
  fim: number,
) => Promise<{ data: NotificacaoResumo[] | null; error: { message: string } | null }>;

// Teto de linhas por consulta no PostgREST e o teto que a consulta antiga
// aplicava por usuario.
const TAMANHO_PAGINA = 1000;
const LIMITE_POR_USUARIO = 50;
// Bloco de ids na URL: 200 ids nao estouram o tamanho de URL do PostgREST.
const TAMANHO_LOTE = 200;
const HORAS_DIARIO = 24;
const HORAS_SEMANAL = 168;

/** Inicio da janela do usuario: diario olha 24 h, semanal olha 7 dias. */
export function desdeDoUsuario(usuario: UsuarioDigest, agora: number = Date.now()): string {
  const horas = usuario.digest_frequency === "daily" ? HORAS_DIARIO : HORAS_SEMANAL;
  return new Date(agora - horas * 60 * 60 * 1000).toISOString();
}

export interface ResultadoLeitura {
  porUsuario: Map<string, NotificacaoResumo[]>;
  /** Lotes que falharam na leitura — os demais seguem sendo processados. */
  lotesComFalha: number;
}

export async function lerNotificacoesEmLote(
  usuarios: readonly UsuarioDigest[],
  ler: LeitorNotificacoes,
  agora: number = Date.now(),
): Promise<ResultadoLeitura> {
  const porUsuario = new Map<string, NotificacaoResumo[]>();
  if (usuarios.length === 0) return { porUsuario, lotesComFalha: 0 };

  const janela = new Map<string, string>();
  for (const usuario of usuarios) janela.set(usuario.user_id, desdeDoUsuario(usuario, agora));
  // Uma unica leitura serve todos os lotes: a janela mais antiga nao descarta
  // nada, o recorte fino e feito por usuario logo abaixo.
  const desdeMaisAntigo = [...janela.values()].reduce((a, b) => (a < b ? a : b));

  let lotesComFalha = 0;
  for (let i = 0; i < usuarios.length; i += TAMANHO_LOTE) {
    const lote = usuarios.slice(i, i + TAMANHO_LOTE).map((usuario) => usuario.user_id);
    for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
      const { data, error } = await ler(lote, desdeMaisAntigo, inicio, inicio + TAMANHO_PAGINA - 1);
      if (error) {
        lotesComFalha += 1;
        break;
      }
      const linhas = data ?? [];
      for (const linha of linhas) {
        const desde = janela.get(linha.user_id);
        if (!desde || linha.created_at < desde) continue;
        const atuais = porUsuario.get(linha.user_id) ?? [];
        if (atuais.length >= LIMITE_POR_USUARIO) continue;
        atuais.push(linha);
        porUsuario.set(linha.user_id, atuais);
      }
      // Pagina incompleta = acabou; completa = pode haver mais.
      if (linhas.length < TAMANHO_PAGINA) break;
    }
  }

  return { porUsuario, lotesComFalha };
}

export interface ResumoDoDigest {
  message: string;
  metadata: { grouped_count: number; categories: Record<string, NotificacaoResumo[]> };
}

/** Monta mensagem e metadados exatamente como o digest sempre montou. */
export function montarMensagem(notificacoes: readonly NotificacaoResumo[]): ResumoDoDigest {
  const grouped: Record<string, NotificacaoResumo[]> = {};
  for (const notificacao of notificacoes) {
    const categoria = notificacao.category || "system";
    if (!grouped[categoria]) grouped[categoria] = [];
    grouped[categoria].push(notificacao);
  }
  const summary = Object.entries(grouped)
    .map(([categoria, itens]) => `${categoria}: ${itens.length} notificação(ões)`)
    .join(", ");
  return {
    message: `Você tem ${notificacoes.length} notificações não lidas. ${summary}`,
    metadata: { grouped_count: notificacoes.length, categories: grouped },
  };
}