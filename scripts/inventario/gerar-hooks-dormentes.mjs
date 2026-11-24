#!/usr/bin/env node
/**
 * Hooks dormentes -> docs/estado/hooks-dormentes.md (etapa 159 do plano de QA).
 *
 * Le o codigo, nao documentacao:
 *  - Inventaria os hooks exportados em src/hooks/** (fora de testes).
 *  - Procura consumidor em TODAS as formas de import (alias `@/`, caminho relativo, `import()`
 *    dinamico, `export ... from`) e separa consumidor de producao de consumidor de teste.
 *  - Calcula o alcance real a partir de src/routes/*.tsx, de src/App.tsx e de src/main.tsx, seguindo
 *    todos os imports locais (inclusive src/components), para nao repetir o falso positivo de
 *    "sem rota" em hook que so aparece em componente.
 *  - Cruza tabelas/RPCs/edges do hook com inventario/estado/banco.json (linhas em producao).
 *
 * Uso: node scripts/inventario/gerar-hooks-dormentes.mjs [--listar]
 * Saida deterministica (sem data de execucao; a data do banco vem do proprio banco.json).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extrairImports, resolverImport } from './gerar-rotas.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA = path.join(RAIZ, 'docs/estado/hooks-dormentes.md');
const EXT = ['.ts', '.tsx'];
const SHELL = ['src/App.tsx', 'src/main.tsx'];

/** Valor de produto de cada hook, curado a mao. Hook sem entrada aparece como "—". */
const VALOR = {
  useAudioOutputDevices: 'Escolher a saída de áudio (alto-falante/fone) durante a chamada — hoje só o componente `WebRTCCall.tsx`, que nenhuma tela monta.',
  useContactAlerts: 'Avisar o agente sobre alerta de relacionamento do contato — hoje só o dropdown `ContactAlertsDropdown.tsx`, que nenhuma tela monta.',
  useNotifications: 'Sino de notificações do topo (lido/não lido) para o agente logado.',
  useRealtimeHoldAlerts: 'Badge em tempo real quando outra sessão deixa um cliente em espera.',
  useQualityAlerts: 'Alertas de qualidade da chamada (métricas de tronco e de áudio) para o supervisor.',
  useTrunkFailoverMonitor: 'Avisa quando um tronco VoIP cai e o tráfego muda de rota.',
  useUnreadConflicts: 'Avisa quando dois agentes editaram o mesmo registro (conflito de edição).',
  useTelemetry: 'Mede desempenho do app por rota para achar tela lenta.',
  useCrmFieldSuggestions: 'Sugere campos de CRM na tela da chamada a partir do que já foi preenchido.',
  useAchievementNotifications: 'Notifica o agente quando ele ganha uma conquista.',
  useBattleCardDetection: 'Detecta na transcrição ao vivo o momento de mostrar o battle card.',
  'use-mobile': 'Decide se o layout usa a versão de celular.',
};

const rel = (abs) => path.relative(RAIZ, abs).split(path.sep).join('/');
const ehTeste = (p) => /(^|\/)(__tests__|e2e|test)(\/|$)|\.(test|spec)\.[tj]sx?$/.test(p);
const existe = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

function listarArquivos(dirAbs) {
  const out = [];
  if (!fs.existsSync(dirAbs)) return out;
  for (const entrada of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const abs = path.join(dirAbs, entrada.name);
    if (entrada.isDirectory()) { if (!/node_modules|dist|coverage/.test(entrada.name)) out.push(...listarArquivos(abs)); }
    else if (EXT.includes(path.extname(entrada.name))) out.push(abs);
  }
  return out;
}

/** Fechamento de imports locais a partir de um arquivo (segue todas as pastas). */
function fechamento(arquivoAbs, vistos = new Set()) {
  if (vistos.has(arquivoAbs) || !existe(arquivoAbs)) return vistos;
  vistos.add(arquivoAbs);
  for (const imp of extrairImports(fs.readFileSync(arquivoAbs, 'utf8'))) {
    const alvo = resolverImport(RAIZ, arquivoAbs, imp.especificador);
    if (typeof alvo === 'string') fechamento(alvo, vistos);
  }
  return vistos;
}

/** Mapa arquivo -> rotulos que o alcancam ("/rota" ou "shell: src/App.tsx"). */
function alcancePorArquivo(rotasJson) {
  const mapa = new Map();
  const marcar = (arquivoAbs, rotulo) => {
    if (!mapa.has(arquivoAbs)) mapa.set(arquivoAbs, new Set());
    mapa.get(arquivoAbs).add(rotulo);
  };
  for (const rota of rotasJson.rotas || []) {
    for (const alcancado of fechamento(path.join(RAIZ, rota.arquivo))) marcar(alcancado, rota.caminho);
  }
  for (const shell of SHELL) {
    for (const alcancado of fechamento(path.join(RAIZ, shell))) marcar(alcancado, `shell: ${shell}`);
  }
  return mapa;
}

/** Tabelas (.from, /rest/v1), RPCs e edges alcancados pelo hook, seguindo imports locais. */
function coletarAcesso(arquivoAbs, vistos = new Set()) {
  const tabelas = new Set(), rpcs = new Set(), edges = new Set();
  if (vistos.has(arquivoAbs) || !existe(arquivoAbs)) return { tabelas, rpcs, edges };
  vistos.add(arquivoAbs);
  const texto = fs.readFileSync(arquivoAbs, 'utf8');
  for (const m of texto.matchAll(/\.from\(\s*['"`]([^'"`$]+)['"`]/g)) tabelas.add(m[1]);
  for (const m of texto.matchAll(/\/rest\/v1\/([a-zA-Z0-9_]+)/g)) tabelas.add(m[1]);
  for (const m of texto.matchAll(/\.rpc\(\s*['"`]([^'"`$]+)['"`]/g)) rpcs.add(m[1]);
  for (const m of texto.matchAll(/(?:functions\.)?invoke\(\s*['"`]([^'"`$]+)['"`]/g)) edges.add(m[1]);
  for (const imp of extrairImports(texto)) {
    const alvo = resolverImport(RAIZ, arquivoAbs, imp.especificador);
    if (typeof alvo === 'string') {
      const r = coletarAcesso(alvo, vistos);
      r.tabelas.forEach((t) => tabelas.add(t));
      r.rpcs.forEach((v) => rpcs.add(v));
      r.edges.forEach((v) => edges.add(v));
    }
  }
  return { tabelas, rpcs, edges };
}

function main() {
  const rotasJson = JSON.parse(fs.readFileSync(path.join(RAIZ, 'inventario/estado/rotas.json'), 'utf8'));
  const banco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'inventario/estado/banco.json'), 'utf8'));
  const linhasPorTabela = new Map((banco.tabelas || []).map((t) => [t.nome, t]));
  const alcance = alcancePorArquivo(rotasJson);

  const arquivos = [...listarArquivos(path.join(RAIZ, 'src')), ...listarArquivos(path.join(RAIZ, 'supabase/functions'))];
  const importadores = new Map();
  for (const arquivo of arquivos) {
    for (const imp of extrairImports(fs.readFileSync(arquivo, 'utf8'))) {
      const alvo = resolverImport(RAIZ, arquivo, imp.especificador);
      if (typeof alvo !== 'string') continue;
      if (!importadores.has(alvo)) importadores.set(alvo, new Set());
      importadores.get(alvo).add(rel(arquivo));
    }
  }
  const prodImporters = (arquivoRel) =>
    [...(importadores.get(path.join(RAIZ, arquivoRel)) ?? [])].filter((p) => !ehTeste(p));

  const itens = listarArquivos(path.join(RAIZ, 'src/hooks'))
    .filter((abs) => !ehTeste(rel(abs)))
    .map((abs) => {
      const texto = fs.readFileSync(abs, 'utf8');
      const nomes = [...texto.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(use[A-Za-z0-9_]*)/g)].map((m) => m[1]);
      if (nomes.length === 0) return null; // tipos, barris e helpers nao sao hooks
      const imp = [...(importadores.get(abs) ?? [])];
      const impProd = imp.filter((p) => !ehTeste(p));
      const rotulos = new Set(alcance.get(abs) ?? []);
      for (const consumidor of impProd) {
        for (const r of alcance.get(path.join(RAIZ, consumidor)) ?? []) rotulos.add(r);
      }
      const { tabelas, rpcs, edges } = coletarAcesso(abs);
      const rotulosArr = [...rotulos].sort();
      const consumidoresVivos = impProd.filter((p) => prodImporters(p).length > 0);
      const status = impProd.length === 0 ? 'sem consumidor'
        : consumidoresVivos.length === 0 ? 'só em componente órfão'
        : rotulosArr.length === 0 ? 'sem rota'
        : rotulosArr.every((r) => r.startsWith('shell:')) ? 'só shell'
        : 'em rota';
      return {
        arquivo: rel(abs),
        nome: path.basename(abs, path.extname(abs)),
        nomes,
        impProd,
        impTeste: imp.filter(ehTeste),
        rotulos: rotulosArr,
        status,
        tabelas: [...tabelas].sort(),
        rpcs: [...rpcs].sort(),
        edges: [...edges].sort(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const grupo = (status) => itens.filter((i) => i.status === status);
  const tabela = (lista) => (lista.length
    ? lista.map((i) => `| \`${i.nome}\` | \`${i.arquivo}\` | ${i.impProd.map((p) => `\`${p}\``).join('<br>') || '**nenhum**'} | ${i.impTeste.length} | ${i.rotulos.map((r) => r.replace(/^shell: /, '')).join(', ') || '—'} | ${i.tabelas.map((t) => {
      const info = linhasPorTabela.get(t);
      return info ? `${t} (${info.linhas}${info.linhas_exatas ? '' : '~'})` : `${t} (?)`;
    }).join(', ') || '—'} | ${i.rpcs.join(', ') || '—'} | ${i.edges.join(', ') || '—'} | ${VALOR[i.nome] ?? '—'} |`)
    : ['| — | — | — | — | — | — | — | — | — |']);

  const cabecalho = [
    '| Hook | Arquivo | Importadores (producao) | Teste | Alcance | Tabelas (linhas) | RPC | Edge | O que o produto ganha |',
    '|---|---|---|---|---|---|---|---|---|',
  ];

  const semConsumidor = grupo('sem consumidor');
  const orfaos = grupo('só em componente órfão');
  const semRota = grupo('sem rota');
  const soShell = grupo('só shell');
  const emRota = grupo('em rota');
  const efetivamenteDormentes = [...semConsumidor, ...orfaos];

  const md = [
    '<!-- Gerado por scripts/inventario/gerar-hooks-dormentes.mjs (etapa 159). Nao editar a mao. -->',
    '',
    '# Hooks dormentes — inventário conferido por leitura de código',
    '',
    '> **Procedência:** `src/hooks/**` cruzado com os importadores em `src/**` e `supabase/functions/**`',
    '> (alias `@/`, caminho relativo, `import()` dinâmico e `export ... from`), com o alcance real a partir de',
    '> `src/routes/*.tsx`, `src/App.tsx` e `src/main.tsx` (fechamento de imports, inclusive por `src/components/`),',
    `> e com \`inventario/estado/banco.json\` (linhas por tabela, medido em ${banco.medido_em ?? '?'}).`,
    '> **Regenerar:** `node scripts/inventario/gerar-hooks-dormentes.mjs` (aceita `--listar`).',
    '> **Limitação:** a contagem de linhas é a foto do banco na data acima; "alcance" é estático — não prova',
    '> que a tela monta o componente em runtime (só que o import existe a partir de uma rota ou do shell).',
    '',
    `**Resumo:** ${itens.length} hooks de produção — **${efetivamenteDormentes.length} efetivamente dormentes** ` +
      `(${semConsumidor.length} sem nenhum consumidor + ${orfaos.length} que só existem dentro de componente órfão), ` +
      `${semRota.length} sem rota, ${soShell.length} alcançados só pelo shell do app e ${emRota.length} em uso por rota.`,
    '',
    '## 1. Sem nenhum consumidor de produção',
    '',
    ...cabecalho,
    ...tabela(semConsumidor),
    '',
    '## 2. Só existem dentro de componente órfão (componente que nada importa)',
    '',
    ...cabecalho,
    ...tabela(orfaos),
    '',
    '## 3. Têm consumidor vivo, mas nenhuma rota nem o shell alcança',
    '',
    ...cabecalho,
    ...tabela(semRota),
    '',
    '## 4. Alcançados apenas pelo shell do app (layout, providers, serviços globais)',
    '',
    ...cabecalho,
    ...tabela(soShell),
    '',
    '## 5. Em uso por rota',
    '',
    `${emRota.length} hooks são alcançados por pelo menos uma rota. Lista (hook → tabelas):`,
    '',
    emRota.map((i) => `- \`${i.nome}\``).join(' ') || '- nenhum',
    '',
    '## Como foi verificado',
    '',
    '```bash',
    '# regenerar este arquivo (varredura completa)',
    'node scripts/inventario/gerar-hooks-dormentes.mjs --listar',
    '# conferir um hook na mão: nenhuma linha = sem consumidor de produção',
    "grep -rn \"from '@/hooks/<hook>'\" src supabase/functions --include='*.ts' --include='*.tsx' | grep -v __tests__",
    '# conferir um componente órfão',
    "grep -rn \"from '@/components/<pasta>/<Componente>'\" src --include='*.tsx' | grep -v __tests__",
    '```',
    '',
    'O `inventario/estado/rotas.json` é entrada deste script; se ele estiver defasado, rode antes',
    '`node scripts/inventario/gerar-rotas.mjs`.',
    '',
  ].join('\n');

  fs.writeFileSync(SAIDA, md);
  console.log(`hooks-dormentes.md: ${itens.length} hooks; ${semConsumidor.length} sem consumidor, `
    + `${orfaos.length} só em componente orfao, ${semRota.length} sem rota, ${soShell.length} so shell, ${emRota.length} em rota.`);
  if (process.argv.includes('--listar')) {
    for (const i of efetivamenteDormentes) console.log(` - ${i.nome} :: ${i.arquivo} (importadores: ${i.impProd.join(',') || 'nenhum'})`);
  }
}

main();