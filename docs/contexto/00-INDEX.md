# CONTEXTO PARA AGENTES DE IA — ÍNDICE ÚNICO

> Gerado automaticamente por indice.py · 2026-11-13 23:53 UTC · HEAD `feeb6788ba` · Não edite à mão.

Um sistema, três fontes de verdade, três produtores independentes. **Leia este arquivo e vá direto à fonte certa.** Cada fato tem um dono: se duas fontes discordarem, vale o dono.

## Onde está cada coisa

| Preciso de… | Fonte (dona do fato) | Onde ler | Estado |
|---|---|---|---|
| Regras que não podem ser quebradas: RLS por operação, estados e transições, validações, fórmulas, prazos, erros de negócio, testes como especificação, inconsistências código×schema (NÃO VERIFICADO) e regras humanas (`manual/`) | **regras de negócio** | `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` | ok · 5 min atrás |
| Tabelas, colunas, RLS/políticas, funções, triggers, cron, storage, lints — **como está em produção agora** | **banco real** | `docs/contexto/supabase/README.md` | parcial · 5 min atrás · ⚠️ 1 erro(s) de coleta no manifest (erros); 1 seção(ões) com erro em errors.md |
| Rotas, telas, módulos, hooks, edge functions, grafo de dependências, testes, scripts, convenções | **código** | `docs/contexto/codigo/INDEX.md` | ok · 6 min atrás |

## Ordem de leitura antes de qualquer tarefa ou planejamento

1. **regras de negócio** — Qualquer mudança de comportamento · Antes de criar status/valor/validação · Antes de planejar.
2. **banco real** — Vou tocar tabela/coluna/política/função SQL · Quero saber se algo existe de verdade no banco.
3. **código** — Vou mexer em tela/rota/hook/edge · Preciso saber onde uma coisa vive e quem a usa.

## Regras do protocolo

- Tabela/coluna/política existe? → **banco real**. Migrations do repo são histórico, não estado.
- Onde fica, quem chama, o que importa o quê? → **código**.
- Pode fazer isso? Qual estado vem depois? Qual o limite? → **regras de negócio** (inclui `manual/`, escrito por humanos, prioridade máxima).
- Item listado como **NÃO VERIFICADO** ou **inconsistência** em qualquer fonte: confirme na fonte dona antes de assumir.
- Nada aqui é editado à mão. Para registrar uma regra que só o negócio sabe, escreva em `manual/` da fonte de regras.

<details><summary>Arquivos de <b>banco real</b> (`docs/contexto/supabase/`)</summary>

- `docs/contexto/supabase/CHANGELOG.md`
- `docs/contexto/supabase/README.md`
- `docs/contexto/supabase/auth.md`
- `docs/contexto/supabase/cron-runs.md`
- `docs/contexto/supabase/cron.md`
- `docs/contexto/supabase/edge-functions.md`
- `docs/contexto/supabase/edge-functions/analyze-call/README.md`
- `docs/contexto/supabase/edge-functions/analyze-contact-profile/README.md`
- `docs/contexto/supabase/edge-functions/analyze-live-utterance/README.md`
- `docs/contexto/supabase/edge-functions/analyze-sentiment/README.md`
- `docs/contexto/supabase/edge-functions/analyze-talk-ratio/README.md`
- `docs/contexto/supabase/edge-functions/approve-password-reset/README.md`
- `docs/contexto/supabase/edge-functions/auto-scorecard/README.md`
- `docs/contexto/supabase/edge-functions/bitrix-api/README.md`
- `docs/contexto/supabase/edge-functions/chat-widget-session/README.md`
- `docs/contexto/supabase/edge-functions/chatbot-respond/README.md`
- `docs/contexto/supabase/edge-functions/check-alerts/README.md`
- `docs/contexto/supabase/edge-functions/check-contact-alerts/README.md`
- `docs/contexto/supabase/edge-functions/check-goals/README.md`
- `docs/contexto/supabase/edge-functions/check-hold-alerts/README.md`
- `docs/contexto/supabase/edge-functions/check-queue-metrics/README.md`
- `docs/contexto/supabase/edge-functions/cleanup-lock-conflicts/README.md`
- `docs/contexto/supabase/edge-functions/compute-account-health/README.md`
- `docs/contexto/supabase/edge-functions/compute-adherence/README.md`
- `docs/contexto/supabase/edge-functions/compute-best-time/README.md`
- `docs/contexto/supabase/edge-functions/compute-deal-health/README.md`
- `docs/contexto/supabase/edge-functions/data-lake-flush/README.md`
- `docs/contexto/supabase/edge-functions/database-backup/README.md`
- `docs/contexto/supabase/edge-functions/database-cleanup/README.md`
- `docs/contexto/supabase/edge-functions/detect-churn-risk/README.md`
- `docs/contexto/supabase/edge-functions/detect-key-moments/README.md`
- `docs/contexto/supabase/edge-functions/dialer-pacing-tick/README.md`
- `docs/contexto/supabase/edge-functions/elevenlabs-conversation-token/README.md`
- `docs/contexto/supabase/edge-functions/email-inbound/README.md`
- `docs/contexto/supabase/edge-functions/embed-kb-article/README.md`
- `docs/contexto/supabase/edge-functions/enforce-sla/README.md`
- `docs/contexto/supabase/edge-functions/enroll-voice/README.md`
- `docs/contexto/supabase/edge-functions/export-data-lake/README.md`
- `docs/contexto/supabase/edge-functions/extract-crm-fields/README.md`
- `docs/contexto/supabase/edge-functions/forecast-call-volume/README.md`
- `docs/contexto/supabase/edge-functions/forecast-deals/README.md`
- `docs/contexto/supabase/edge-functions/fuzz-test-runner/README.md`
- `docs/contexto/supabase/edge-functions/generate-coaching-plan/README.md`
- `docs/contexto/supabase/edge-functions/generate-coaching-track/README.md`
- `docs/contexto/supabase/edge-functions/generate-coaching/README.md`
- `docs/contexto/supabase/edge-functions/generate-meeting-summary/README.md`
- `docs/contexto/supabase/edge-functions/generate-summary/README.md`
- `docs/contexto/supabase/edge-functions/global-load-test/README.md`
- `docs/contexto/supabase/edge-functions/health-check/README.md`
- `docs/contexto/supabase/edge-functions/migrate-helper/README.md`
- `docs/contexto/supabase/edge-functions/notify-blocked-ip/README.md`
- `docs/contexto/supabase/edge-functions/notify-new-device/README.md`
- `docs/contexto/supabase/edge-functions/ocr-virtual-fax/README.md`
- `docs/contexto/supabase/edge-functions/process-digest/README.md`
- `docs/contexto/supabase/edge-functions/realtime-analysis/README.md`
- `docs/contexto/supabase/edge-functions/record-consent/README.md`
- `docs/contexto/supabase/edge-functions/redact-sensitive-audio/README.md`
- `docs/contexto/supabase/edge-functions/request-password-reset/README.md`
- `docs/contexto/supabase/edge-functions/rls-audit/README.md`
- `docs/contexto/supabase/edge-functions/score-call-attempt/README.md`
- `docs/contexto/supabase/edge-functions/score-call/README.md`
- `docs/contexto/supabase/edge-functions/search-calls/README.md`
- `docs/contexto/supabase/edge-functions/send-notification/README.md`
- `docs/contexto/supabase/edge-functions/send-survey/README.md`
- `docs/contexto/supabase/edge-functions/sip-config/README.md`
- `docs/contexto/supabase/edge-functions/suggest-shift-swaps/README.md`
- `docs/contexto/supabase/edge-functions/sync-crm-queue/README.md`
- `docs/contexto/supabase/edge-functions/teams-fetch-recordings/README.md`
- `docs/contexto/supabase/edge-functions/transcribe-recording/README.md`
- `docs/contexto/supabase/edge-functions/translate-summary/README.md`
- `docs/contexto/supabase/edge-functions/translate-utterance/README.md`
- `docs/contexto/supabase/edge-functions/validate-geo/README.md`
- `docs/contexto/supabase/edge-functions/validate-ip/README.md`
- `docs/contexto/supabase/edge-functions/verify-voice/README.md`
- `docs/contexto/supabase/edge-functions/voice-command/README.md`
- `docs/contexto/supabase/edge-functions/voice-transcribe/README.md`
- `docs/contexto/supabase/edge-functions/voip-anomaly-detector/README.md`
- `docs/contexto/supabase/edge-functions/voip-anomaly-remediation/README.md`
- `docs/contexto/supabase/edge-functions/voip-capacity-forecast/README.md`
- `docs/contexto/supabase/edge-functions/voip-capacity-recommendations/README.md`
- … +207

</details>

<details><summary>Arquivos de <b>código</b> (`docs/contexto/codigo/`)</summary>

- `docs/contexto/codigo/GRAPH_REPORT.md`
- `docs/contexto/codigo/INDEX.md`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/manifest.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`

</details>

<details><summary>Arquivos de <b>regras de negócio</b> (`docs/contexto/regras/`)</summary>

- `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`
- `docs/contexto/regras/10-ACESSO-E-SEGURANCA.md`
- `docs/contexto/regras/11-GLOSSARIO-E-LACUNAS.md`
- `docs/contexto/regras/context.json`
- `docs/contexto/regras/manifest.json`
- `docs/contexto/regras/manual/README.md`
- `docs/contexto/regras/manual/TEMPLATE-regras-de-negocio.md`

</details>
