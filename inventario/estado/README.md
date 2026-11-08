# Estado real do projeto — inventário gerado

Pasta de **dados gerados por script**, não de relatórios escritos à mão. É a fonte de consulta dos
agentes para "o que existe hoje" no banco e no código. Se um número aqui divergir do que você mediu,
regere o arquivo (comandos abaixo) em vez de corrigir à mão.

| Arquivo | Como gerar | O que tem |
|---|---|---|
| `banco.json` | `SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs` (Management API: `/database/query/read-only` + `/functions`, só leitura) **ou**, sem token, rodar `scripts/inventario/banco.sql` no MCP oficial do projeto `cfmlmcdyjuotqobjapng` (`db_query`), salvar a resposta e `node scripts/inventario/gerar-banco.mjs --entrada <arquivo>` | banco oficial, só leitura: cada tabela (RLS, policies, triggers, linhas, tamanho, se é citada em função/view e quantos `.from()` e `/rest/v1/<tabela>` tem em `src/` e `supabase/functions/`), tabelas órfãs, cada cron job (agenda, funções chamadas, falhas e taxa em 24 h/7 d, duração máxima), horas em que o cron ficou parado, tamanho do histórico do cron, troncos VoIP (`voip_trunks`: provedor, prioridade, canais, saúde, failover) e chamadas/gravações em 7 dias, edge functions publicadas × pastas do repo (só com token; sem token fica `publicadas: null`), e a lista `alertas` |
| `rotas.json` | `node scripts/inventario/gerar-rotas.mjs` (`--check` só confere se está em dia) | as rotas de `src/routes/publicRoutes.tsx` e `src/routes/protectedRoutes.tsx` (path, componente, arquivo, papéis exigidos) e, por rota, os hooks, tabelas, RPCs, buckets e edge functions alcançados pelos imports da página (`functions.invoke` e `fetch` em `/functions/v1/<edge>`), mais `paginas_orfas` e a lista `problemas` (rota sem arquivo, path duplicado, página órfã, import quebrado) |
| `edges.json` | `node scripts/inventario/gerar-repo.mjs` | as edge functions: linhas, segredos lidos (`Deno.env.get`) e quem invoca cada uma (src, migrations, outras edges, e2e, CI) |
| `tabelas-uso.json` (não versionado) | `node scripts/inventario/gerar-repo.mjs < lista-de-tabelas.txt` | quantos `.from('tabela')` cada tabela tem — hoje também sai em `banco.json` → `tabelas[].uso_no_codigo` |

## Como ler `banco.json`

- **`alertas`** é o que um agente precisa saber antes de mexer: `tabela_sem_rls`, `cron_falhando`
  (taxa ≥ 5 % em 7 dias), `cron_parado` (hora com mais da metade das execuções falhando),
  `cron_sem_execucao` (job ativo que roda todo dia sem nenhuma execução em 24 h — o cron 100 % parado
  não grava falha, então só aparece aqui), `historico_cron_sem_limpeza` (> 50 mil linhas com mais de
  7 dias), `telefonia_sem_tronco_ativo`,
  `telefonia_tronco_degradado`, `telefonia_tronco_sem_health_check`, `telefonia_failover_registrado`,
  `edge_sem_deploy` e `edge_publicada_sem_codigo`.
  Os limiares estão em `LIMIARES` no script.
- **`tabelas_orfas`**: 0 linhas + não citada em função/view do banco + nenhum `.from()` nem `/rest/v1/` no código
  (`.from(variavel)` não é resolvido).
  Candidata a limpeza, não prova de que pode apagar (pode ser usada por RPC com outro nome ou por
  sistema externo).
- **`linhas`** é `count(*)` exato quando a tabela tem menos de 200 mil linhas (`linhas_exatas: true`);
  acima disso, a estimativa do planner. Não confie em `pg_stat_user_tables.n_live_tup`: zera quando o
  banco reinicia.
- Contagens rodam com o papel da conexão. Nos dois caminhos o RLS não filtra: `service_role` (MCP) e
  `supabase_read_only_user` (endpoint read-only da Management API) têm `rolbypassrls = true` no banco oficial
  (NÃO VERIFICADO neste projeto); com outro papel, tabelas com RLS e `cron.job` podem vir incompletas.
- A resposta só é gravada se as tabelas baterem (≥ 90 %, nos dois sentidos) com a foto independente da
  produção (`supabase/schema-manifest.json`, ou as tabelas de `src/integrations/supabase/types.ts`, gerado
  pelo Supabase) **e** o ledger bater com `supabase/migrations/`: maior versão aplicada entre as 20 migrations mais recentes do
  repo (ou à frente) e quantidade de registros a até 10 % da de arquivos. Barra resposta colada de outro banco
  (ex.: MCP errado ou o projeto `dyibdjwuoibwwpidgsxu` citado em migration antiga).
- O PR semanal (`inventario-estado-semanal.yml`) só abre quando algo estrutural mudou de verdade:
  tabela nova/apagada, alerta novo, RLS/policy, contagem real de linhas de tabela, tela/rota, edge etc.
  `medido_em`/`gerado_em` sozinhos não abrem PR, e a telemetria viva do cron/telefonia também não
  (`execucoes_24h`, `taxa_falha_7d_pct`, `horas_paradas_7d`, `cron.historico.linhas/bytes`,
  `chamadas_7d`, `gravacoes_7d`, `ultimo_health_check`, `health_latencia_ms`, `ultimo_failover`): esses números rolam toda semana só pela
  janela de 7 dias, sem mudança real, e abrir PR por isso era ruído. Quem quiser o valor fresco desses
  campos regenera à mão (comandos acima). Como só esses campos mudarem nunca abre PR sozinho, o
  commitado pode ficar atrasado por tempo indefinido neles — semanas a fio sem nenhuma mudança
  estrutural não atualizam nada; confie neles só depois de regenerar.
- Nada de segredo sai do banco: de `cron.job` só o nome das funções chamadas (nunca o comando, que pode
  ter URL/cabeçalho); de `voip_trunks`, nem `sip_password_encrypted` nem
  telefone. O script se recusa a gravar saída com cara de credencial (Bearer, JWT, `sb_secret_`).
