// O cron da fila do CRM (migration 20261128110000) manda um bearer opaco lido do
// Vault e a edge confere no banco. Estes testes cobrem a decisao pura: o que e
// aceito como token e quando o banco autoriza.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  SEGREDO_CRON_FILA_CRM,
  tokenCronValido,
  tokenDoBearer,
} from '../cron-db-token.ts';

const TOKEN = '9f2c7b1d4a6e48f0b3d5c8a1972e6f4b8a0d3c6e9f1b4a7d2c5e8f0b3a6d9c2e';

Deno.test('tokenDoBearer: aceita o formato do cron', () => {
  assertEquals(tokenDoBearer(`Bearer ${TOKEN}`), TOKEN);
});

Deno.test('tokenDoBearer: recusa header ausente, sem prefixo ou vazio', () => {
  assertEquals(tokenDoBearer(null), null);
  assertEquals(tokenDoBearer(undefined), null);
  assertEquals(tokenDoBearer(TOKEN), null);
  assertEquals(tokenDoBearer('bearer ' + TOKEN), null);
  assertEquals(tokenDoBearer('Bearer '), null);
  assertEquals(tokenDoBearer('Bearer    '), null);
});

const clienteRpc = (resposta: { data: unknown; error: unknown }) => {
  const chamadas: Array<Record<string, string>> = [];
  return {
    chamadas,
    rpc: (_fn: string, args: Record<string, string>) => {
      chamadas.push(args);
      return Promise.resolve(resposta);
    },
  };
};

Deno.test('tokenCronValido: true apenas quando o banco devolve true', async () => {
  const c = clienteRpc({ data: true, error: null });
  assertEquals(await tokenCronValido(c, TOKEN), true);
  assertEquals(c.chamadas, [{ p_nome: SEGREDO_CRON_FILA_CRM, p_token: TOKEN }]);
});

Deno.test('tokenCronValido: false quando o banco nega ou erra', async () => {
  assertEquals(await tokenCronValido(clienteRpc({ data: false, error: null }), TOKEN), false);
  assertEquals(
    await tokenCronValido(clienteRpc({ data: null, error: { message: 'permission denied' } }), TOKEN),
    false,
  );
  assertEquals(await tokenCronValido(clienteRpc({ data: 'true', error: null }), TOKEN), false);
});

Deno.test('tokenCronValido: nao chama o banco sem token', async () => {
  const c = clienteRpc({ data: true, error: null });
  assertEquals(await tokenCronValido(c, null), false);
  assertEquals(c.chamadas.length, 0);
});

Deno.test('tokenCronValido: excecao do cliente vira false (cai no caminho de sessao)', async () => {
  const quebrado = {
    rpc: () => Promise.reject(new Error('sem rede')),
  };
  assertEquals(await tokenCronValido(quebrado, TOKEN), false);
});