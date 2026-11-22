// A exportacao e a resposta legal a um pedido de LGPD: o CSV entregue
// precisa conter TODAS as colunas e nao pode corromper campos com aspas,
// virgula ou quebra de linha. Estes testes travam esse contrato.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { toCsv } from "../csv.ts";

Deno.test("toCsv: vazio devolve string vazia", () => {
  assertEquals(toCsv([]), "");
});

Deno.test("toCsv: cabecalho e a uniao das colunas, sem perder dados", () => {
  // Bug corrigido: antes o cabecalho vinha so de rows[0] e a coluna
  // extra abaixo era descartada silenciosamente.
  const csv = toCsv([
    { id: 1, nome: "Ana" },
    { id: 2, nome: "Bia", email: "bia@exemplo.com" },
  ]);
  assertEquals(csv.split("\n")[0], "id,nome,email");
  assert(csv.includes("bia@exemplo.com"));
});

Deno.test("toCsv: escapa virgula, aspas e quebra de linha", () => {
  const csv = toCsv([{ obs: 'tem, virgula e "aspas"\ne fim de linha' }]);
  const linha = csv.split("\n").slice(1).join("\n");
  // O campo inteiro precisa estar entre aspas, com as aspas internas
  // duplicadas — o padrao que qualquer parser CSV entende.
  assert(linha.startsWith('"'), `campo nao foi aspeado: ${linha}`);
  assert(linha.includes('""aspas""'), `aspas nao foram duplicadas: ${linha}`);
});

Deno.test("toCsv: nulo e undefined viram vazio", () => {
  const csv = toCsv([{ a: null, b: undefined, c: 0 }]);
  assertEquals(csv.split("\n")[1], ",,0");
});
