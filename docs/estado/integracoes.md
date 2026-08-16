# Integrações de Terceiros — Implementadas, Parciais e Planejadas

> **Procedência:** síntese própria da auditoria de estado. Método: extração por `grep` de todos os hosts externos em `src/` e `supabase/functions/`, de todos os `Deno.env.get(...)` das Edge Functions, e cruzamento com os relatórios dos 16 lotes.
> **Limitação global:** sem acesso ao runtime. **Nenhuma integração desta página foi testada contra o serviço real** — a classificação distingue "o código faz a chamada de verdade" de "o código simula". Se há tráfego real, é `NAO_VERIFICADO`.

---

## 1. Hosts externos efetivamente chamados no código

Medição direta (`grep -rhoE "https://…"` em `src/` e `supabase/functions/`, ocorrências agregadas):

| Host | Ocorrências | Papel |
|---|---:|---|
| `deno.land` | 93 | Imports de runtime das Edge Functions |
| `esm.sh` | 92 | Imports de runtime das Edge Functions |
| `ai.gateway.lovable.dev` | 20 | Gateway de IA (Gemini) — **o motor de IA do sistema** |
| `lovable.dev` / `api.lovable.dev` / `connector-gateway.lovable.dev` | 9 | Plataforma Lovable (auth, gateway) |
| `api.elevenlabs.io` | 3 | Speech-to-text |
| `ipapi.co` | 3 | Geolocalização por IP |
| `www.bitrix24.com.br` | 2 | CRM Bitrix24 |
| `api.resend.com` | 2 | Envio de e-mail |
| `api.pwnedpasswords.com` | 1 | HIBP — verificação de senha vazada |
| `api.ipify.org` | 1 | Descoberta de IP público |
| `meet.jit.si` | 1 | Videoconferência |
| `fonts.googleapis.com` / `fonts.gstatic.com` | 2 | Fontes |

> Hosts como `ex.com`, `a.com`, `exemplo.com`, `mock.supabase.co`, `hook.site` aparecem apenas em fixtures de teste e exemplos — não são integrações.

---

## 2. Segredos exigidos pelas Edge Functions

Extraídos de `Deno.env.get(...)` em `supabase/functions/`:

`BITRIX_WEBHOOK_URL`, `ELEVENLABS_API_KEY`, `LOVABLE_API_KEY`, `MICROSOFT_TEAMS_API_KEY`, `SIP_PASSWORD`, `SIP_SERVER`, `SIP_USERNAME`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `WAVOIP_TOKEN`

⚠️ **Nenhum destes 11 segredos está documentado em `.env.example`** (o arquivo cobre apenas as variáveis `VITE_*` do frontend). Um operador que precise reprovisionar o ambiente não tem, no repositório, a lista do que configurar.

---

## 3. Catálogo de integrações

### ✅ Implementadas e ligadas

| Integração | Onde | Natureza | Segredo |
|---|---|---|---|
| **Supabase** (Postgres, Auth, Storage, Realtime, Edge Functions) | `src/integrations/supabase/client.ts`, todo o sistema | Base de tudo: 181 tabelas, 18 canais realtime, 95 Edge Functions | `VITE_SUPABASE_*` |
| **Lovable AI Gateway / Gemini** | 20 pontos em `supabase/functions/` | Chamadas HTTP reais para análise de sentimento, sumarização, coaching, narrativa executiva, OCR | `LOVABLE_API_KEY` |
| **ElevenLabs** (speech-to-text) | `voice-transcribe/index.ts:63`, `useLiveTranscription.ts:54` | Chamada real a `api.elevenlabs.io/v1/speech-to-text` | `ELEVENLABS_API_KEY` |
| **JsSIP / WebRTC (telefonia SIP)** | `src/hooks/useSipCall.ts` | **Telefonia real** — biblioteca `jssip` de fato integrada, não simulação | `SIP_*` |
| **Bitrix24 (CRM)** | edge `bitrix-api`, `src/hooks/useBitrix.ts`, `src/lib/bitrix/circuit-breaker.ts` | Chamada real, com circuit breaker (closed/open/half-open, threshold 5, cooldown 30s) e fila de retentativa | `BITRIX_WEBHOOK_URL` |
| **Microsoft Teams** | edge `teams-fetch-recordings` | Busca real de gravações | `MICROSOFT_TEAMS_API_KEY` |
| **HIBP (Have I Been Pwned)** | `api.pwnedpasswords.com` | Verificação de senha vazada (Onda 23) | — (API pública) |
| **ipapi.co** | `src/hooks/useDeviceDetection.ts:48,64,109` | Geolocalização para detecção de novo dispositivo | — |
| **Resend** (e-mail) | `api.resend.com` | Envio de notificações | — |
| **pgvector** | migrations + edge `embed-kb-article` | Busca semântica na base de conhecimento | — |

### 🟨 Implementadas com ressalva

| Integração | Ressalva medida |
|---|---|
| **Wavoip** | `wavoip-call` exige `WAVOIP_TOKEN` e **nunca o usa**; as respostas são constantes. `useWavoipCall.ts:125-135` marca a chamada como ativa via `setTimeout(2000)`, não por evento — a UI mostra "atendida" sem atendimento. |
| **Data Lake (BigQuery/Snowflake)** | Edges `data-lake-flush` e `export-data-lake` existem, mas o cron de `data-lake-flush` aponta para **outro projeto Supabase** (`dyibdjwuoibwwpidgsxu`, migration `20260723114001_…:50`). |
| **WhatsApp** | `whatsapp-inbound` existe; injeção de filtro PostgREST em `:41`; o composer da UI (`WhatsappComposer.tsx`) tem **zero importadores**. |
| **Chat widget / e-mail entrante** | `chat-widget-session` e `email-inbound` são webhooks públicos sem registro de origem no repositório. |
| **Lovable Cloud Auth** | `@lovable.dev/cloud-auth-js` importado em `src/integrations/lovable/index.ts` (38 linhas). |

### 🟦 Simuladas ou apenas planejadas

| Integração | Evidência | Situação |
|---|---|---|
| **ElevenLabs WebRTC (conversação em tempo real)** | `src/lib/elevenlabs-stub.ts` — o próprio arquivo declara: *"Stub for @elevenlabs/react… Install @elevenlabs/react for real WebRTC functionality"*. `startSession` emite um `logger.warn` e chama `onConnect()` imediatamente, disparando `toast.success('Conectado')` em `UnifiedSoftphone.tsx:57`. | **Simulada** — o usuário vê "Conectado" sem sessão |
| **LDAP / Active Directory** | `src/pages/LDAPSync.tsx:31-35,42-50` — `setTimeout` como teste de conexão, toast literal "245 contatos atualizados", `MOCK_SYNC_LOGS` em `admin/ldap/types.ts:49-82`. Zero Supabase. | **Fachada completa** |
| **Zoom** | Botão "Em breve" | Planejada |
| **Google Meet** | Botão "Em breve" | Planejada |
| **Jitsi (`meet.jit.si`)** | Uma referência | Iniciada |
| **SMS** | Citado no roadmap (Unified Inbox, D1) | Sem código |
| **BigQuery / Snowflake (conector nativo)** | Roadmap D5 | Apenas a edge genérica de export |

---

## 4. Riscos específicos das integrações

1. **`verify_jwt` não versionado.** `supabase/config.toml` tem **uma única linha** (`project_id`). Nenhuma Edge Function tem sua exigência de JWT declarada no repositório — a superfície de exposição das 95 funções depende inteiramente de configuração de plataforma fora do Git. `NAO_VERIFICADO`.
2. **Segredos não documentados.** Os 11 segredos de Edge Function ausentes do `.env.example` tornam o ambiente não reprovisionável sem conhecimento tácito.
3. **Endpoint de IA divergente.** `voice-command/index.ts:53` chama `https://api.lovable.dev/v1/chat/completions`, enquanto todas as outras funções usam `ai.gateway.lovable.dev`. Uma das duas está errada.
4. **Falha silenciosa de geolocalização.** `useDeviceDetection.ts:48,64,109` — se `ipapi.co` falhar, o alerta de novo dispositivo é **desligado sem erro visível**. Controle de segurança que falha em aberto.
5. **`_shared/validate.ts:24`** faz `Number(value)` sobre entrada externa, e o guard de CI que deveria proibir coerção numérica insegura (`scripts/guard-edge-numeric.mjs`) **pula o diretório `_shared/`**.
6. **Import inexistente.** 4 funções importam `npm:@supabase/supabase-js@2/cors`, um subpath que não existe no pacote.

---

## 5. Resumo

| Situação | Contagem |
|---|---:|
| Integrações reais e ligadas | 10 |
| Reais com ressalva material | 5 |
| Simuladas (código presente, comportamento falso) | 2 |
| Apenas planejadas / "Em breve" | 5 |

**A pilha de integrações é substancialmente real** — SIP, Bitrix24, Gemini, ElevenLabs STT, Teams e HIBP fazem chamadas genuínas. As duas exceções são exatamente as que o usuário percebe como "funcionando": o canal WebRTC do softphone e a sincronização LDAP, ambos simulados com feedback de sucesso.
