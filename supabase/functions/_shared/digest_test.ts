import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  desdeDoUsuario,
  lerNotificacoesEmLote,
  montarMensagem,
  type LeitorNotificacoes,
  type NotificacaoResumo,
} from "./digest.ts";

const AGORA = Date.parse("2026-11-24T12:00:00.000Z");

function notificacao(user_id: string, categoria: string | null, criadaEm: string): NotificacaoResumo {
  return {
    id: `${user_id}-${criadaEm}-${categoria ?? "nula"}`,
    user_id,
    title: "t",
    message: "m",
    category: categoria,
    severity: "info",
    created_at: criadaEm,
  };
}

function leitorFalso(linhas: NotificacaoResumo[]): { ler: LeitorNotificacoes; consultas: Array<{ lote: string[]; desde: string; inicio: number; fim: number }> } {
  const consultas: Array<{ lote: string[]; desde: string; inicio: number; fim: number }> = [];
  const ler: LeitorNotificacoes = (lote, desde, inicio, fim) => {
    consultas.push({ lote: [...lote], desde, inicio, fim });
    const pagina = linhas.slice(inicio, fim + 1);
    return Promise.resolve({ data: pagina, error: null });
  };
  return { ler, consultas };
}

Deno.test("100 usuarios com poucas notificacoes: uma consulta", async () => {
  const usuarios = Array.from({ length: 100 }, (_, i) => ({ user_id: `u${i}`, digest_frequency: "daily" }));
  const linhas = usuarios.slice(0, 30).map((u) => notificacao(u.user_id, "queue", "2026-11-24T11:00:00.000Z"));
  const { ler, consultas } = leitorFalso(linhas);
  const { porUsuario, lotesComFalha } = await lerNotificacoesEmLote(usuarios, ler, AGORA);
  assertEquals(consultas.length, 1);
  assertEquals(lotesComFalha, 0);
  assertEquals(porUsuario.size, 30);
});

Deno.test("lote de ids e quebrado em blocos de 200", async () => {
  const usuarios = Array.from({ length: 450 }, (_, i) => ({ user_id: `u${i}`, digest_frequency: "daily" }));
  const { ler, consultas } = leitorFalso([]);
  await lerNotificacoesEmLote(usuarios, ler, AGORA);
  assertEquals(consultas.map((c) => c.lote.length), [200, 200, 50]);
});

Deno.test("resposta cheia de 1000 linhas e paginada, sem perder usuario", async () => {
  // 20 usuarios x 60 notificacoes = 1200 linhas: a primeira pagina enche e a
  // segunda traz o resto. Cada usuario recebe o teto de 50, nunca menos.
  const usuarios = Array.from({ length: 20 }, (_, i) => ({ user_id: `u${i}`, digest_frequency: "weekly" }));
  const linhas: NotificacaoResumo[] = [];
  for (const usuario of usuarios) {
    for (let n = 0; n < 60; n += 1) {
      const minuto = String(n).padStart(2, "0");
      linhas.push(notificacao(usuario.user_id, "queue", `2026-11-24T10:${minuto}:00.000Z`));
    }
  }
  // A leitura real devolve tudo (o corte em 1000 e do servidor), entao aqui o
  // leitor falso aplica o mesmo corte para exercitar a paginacao.
  const consultas: number[] = [];
  const ler: LeitorNotificacoes = (_lote, _desde, inicio, fim) => {
    consultas.push(inicio);
    return Promise.resolve({ data: linhas.slice(inicio, fim + 1), error: null });
  };
  const { porUsuario } = await lerNotificacoesEmLote(usuarios, ler, AGORA);
  assertEquals(consultas.length, 2);
  assertEquals(porUsuario.size, 20);
  for (const usuario of usuarios) {
    assertEquals(porUsuario.get(usuario.user_id)?.length, 50);
  }
});

Deno.test("janela de cada usuario e respeitada mesmo lendo tudo junto", async () => {
  const usuarios = [
    { user_id: "diario", digest_frequency: "daily" },
    { user_id: "semanal", digest_frequency: "weekly" },
  ];
  const linhas = [
    notificacao("diario", "queue", "2026-11-24T11:00:00.000Z"),   // dentro de 24 h
    notificacao("diario", "queue", "2026-11-20T11:00:00.000Z"),   // 4 dias: fora
    notificacao("semanal", "queue", "2026-11-20T11:00:00.000Z"),  // 4 dias: dentro de 7
    notificacao("semanal", "queue", "2026-11-10T11:00:00.000Z"),  // 14 dias: fora
  ];
  const { ler } = leitorFalso(linhas);
  const { porUsuario } = await lerNotificacoesEmLote(usuarios, ler, AGORA);
  assertEquals(porUsuario.get("diario")?.length, 1);
  assertEquals(porUsuario.get("semanal")?.length, 1);
});

Deno.test("teto de 50 por usuario, mantendo as mais recentes", async () => {
  const usuarios = [{ user_id: "u1", digest_frequency: "weekly" }];
  const linhas = Array.from({ length: 70 }, (_, i) =>
    notificacao("u1", "queue", `2026-11-2${i % 10}T10:00:${String(i).padStart(2, "0")}.000Z`));
  // Ordem que o banco devolve: created_at desc.
  linhas.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const { ler } = leitorFalso(linhas);
  const { porUsuario } = await lerNotificacoesEmLote(usuarios, ler, AGORA);
  const recebidas = porUsuario.get("u1") ?? [];
  assertEquals(recebidas.length, 50);
  assertEquals(recebidas[0].created_at, linhas[0].created_at);
  assertEquals(recebidas[49].created_at, linhas[49].created_at);
});

Deno.test("lote com erro nao derruba os outros lotes", async () => {
  const usuarios = Array.from({ length: 250 }, (_, i) => ({ user_id: `u${i}`, digest_frequency: "daily" }));
  const ler: LeitorNotificacoes = (lote) => {
    if (lote[0] === "u0") return Promise.resolve({ data: null, error: { message: "permission denied" } });
    return Promise.resolve({ data: lote.map((id) => notificacao(id, "queue", "2026-11-24T11:00:00.000Z")), error: null });
  };
  const { porUsuario, lotesComFalha } = await lerNotificacoesEmLote(usuarios, ler, AGORA);
  assertEquals(lotesComFalha, 1);
  assertEquals(porUsuario.size, 50);
});

Deno.test("lista vazia de usuarios nao consulta nada", async () => {
  const { ler, consultas } = leitorFalso([]);
  const { porUsuario } = await lerNotificacoesEmLote([], ler, AGORA);
  assertEquals(consultas.length, 0);
  assertEquals(porUsuario.size, 0);
});

Deno.test("desdeDoUsuario: diario 24 h, semanal 168 h", () => {
  assertEquals(desdeDoUsuario({ user_id: "a", digest_frequency: "daily" }, AGORA), "2026-11-23T12:00:00.000Z");
  assertEquals(desdeDoUsuario({ user_id: "b", digest_frequency: "weekly" }, AGORA), "2026-11-17T12:00:00.000Z");
  // Frequencia desconhecida cai no semanal, como antes.
  assertEquals(desdeDoUsuario({ user_id: "c", digest_frequency: null }, AGORA), "2026-11-17T12:00:00.000Z");
});

Deno.test("mensagem do digest e identica a de antes", () => {
  const notificacoes = [
    notificacao("u1", "queue", "2026-11-24T11:00:00.000Z"),
    notificacao("u1", "queue", "2026-11-24T10:00:00.000Z"),
    notificacao("u1", null, "2026-11-24T09:00:00.000Z"),
    notificacao("u1", "billing", "2026-11-24T08:00:00.000Z"),
  ];
  const { message, metadata } = montarMensagem(notificacoes);
  assertEquals(message, "Você tem 4 notificações não lidas. queue: 2 notificação(ões), system: 1 notificação(ões), billing: 1 notificação(ões)");
  assertEquals(metadata.grouped_count, 4);
  assertEquals(Object.keys(metadata.categories), ["queue", "system", "billing"]);
  assertEquals(metadata.categories.queue.length, 2);
});

Deno.test("montarMensagem com lista vazia nao inventa categoria", () => {
  const { message, metadata } = montarMensagem([]);
  assertEquals(message, "Você tem 0 notificações não lidas. ");
  assertEquals(metadata.grouped_count, 0);
});