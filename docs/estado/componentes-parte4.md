<!-- Gerado pela auditoria de estado. Fonte: lote C4. -->

> **Procedência:** lote `C4` da auditoria de estado.
> **Recontagem de cobertura (Fase D):** 50/80 arquivos citados (62%).
> **Limitação global:** sem acesso ao banco/runtime — nada nesta página é verificado contra produção.

# Lote C4 — src/components (parte 4)

## Cobertura

80 arquivos do manifesto `C4.txt` (~7.790 linhas). Todos foram inspecionados; os
primitivos shadcn/Radix sem lógica de negócio foram tratados em bloco (ver seção
`src/components/ui/*`), com leitura integral apenas dos arquivos que carregam
lógica própria (custom, não-shadcn) ou dados.

Blocos analisados:
- `settings/` (3), `supervisor/` (4) + `supervisor/panel/` (7)
- `translation/` (1), `whatsapp/` (1), `voice/` (7)
- `ui/` (57, dos quais 8 são componentes autorais e 1 é teste)

**Padrões de grep de consumo aplicados (declarados):**
1. `(from|import)[^;]*['"][^'"]*/<base>['"]` — cobre import estático de linha única
   e multilinha (o `[^;]*` atravessa quebras de linha no ripgrep multiline padrão
   por não haver `;` intermediário) e cobre alias `@/`, relativo `./` e `../`.
2. Busca literal do basename em todo `src/` (`grep -rn "<base>"`) para pegar
   `React.lazy(() => import(...))`, `import()` dinâmico, template strings e
   re-export por barrel.
3. Busca por **nome de símbolo exportado** (`grep -rl "\bNome\b"`) para detectar
   exports mortos dentro de arquivos que têm consumidor (caso de
   `keyboard-navigation`, `skeleton-loader`, `empty-state`, `animations`).

Não há barrel `index.ts` em `src/components/ui/`, portanto import indireto está
descartado. Nenhum README/docs/mem foi lido.

## Tabela de funcionalidades

| Componente | Classificação | Evidência | Consumidor | Fonte de dados | O que falta |
|---|---|---|---|---|---|
| settings/SystemLogs.tsx | ✅ IMPLEMENTADO_TOTAL | `SystemLogs.tsx:13-20` query real; `types.ts:580` tabela `audit_logs` existe | `SystemMaintenancePanel.tsx:5,83` | Supabase `audit_logs` (limit 10, refetch 30s) | Sem paginação; import morto `formatDistanceToNow` (`:6`) substituído por `safeFormatDistanceToNow` |
| settings/SystemMaintenancePanel.tsx | ✅ IMPLEMENTADO_TOTAL | `:25` `functions.invoke(fnName)`; `:29-33` `rpc('log_audit_event')`; RPC existe em `types.ts:7582` | `pages/Settings.tsx:298` | 6 edge functions hardcoded em `BACKGROUND_FUNCTIONS` (`:10-17`) | Lista de funções é constante no client; não valida se a function existe antes de invocar |
| settings/VoipSettings.tsx | 🟨 IMPLEMENTADO_PARCIAL | `:28` `navigate('/admin/voip-trunks')`; rota existe em `routes/protectedRoutes.tsx:191` | `pages/Settings.tsx:136` | Nenhuma — card 100% estático | É apenas um card de atalho; título "Configurações VoIP" não configura nada (`:12-32`), delega tudo à página admin |
| supervisor/SupervisorPanel.tsx | ✅ IMPLEMENTADO_TOTAL | `:11` `useSupervisorPanel()`; composição de 6 subcomponentes `:15-21` | `pages/Index.tsx:14` | hook `useSupervisorPanel` | — |
| supervisor/AlertSoundSettings.tsx | ✅ IMPLEMENTADO_TOTAL | `:29-43` sliders com `onConfigChange` real; `:47-52` `onTestSound` | `panel/PanelHeader.tsx:6,25` | props do hook (`AlertSoundConfig`) | — |
| supervisor/SoundProfileManager.tsx | ✅ IMPLEMENTADO_TOTAL | `:11-15` 3 perfis; `:39` `onApplyProfile` real | `panel/PanelHeader.tsx:7,24` | constante local `PROFILES` (config, não métrica) | Perfis não persistem por usuário (só aplicam em memória) |
| **supervisor/QueueTrendChart.tsx** | ⬛ MORTO_OU_ABANDONADO | `:23` `waiting: Math.floor(Math.random()*8)`; `:24` `active: Math.floor(Math.random()*12)+2`; comentário `:16` "Generate sample trend data"; `supabase` importado `:3` e **nunca usado** | `panel/TrendChartToggle.tsx:4,19` → visível ao supervisor | **Nenhuma — dados 100% aleatórios** | Trocar por query real em `call_sessions` agrupada por janela de 5 min |
| supervisor/panel/ActiveCallsList.tsx | ✅ IMPLEMENTADO_TOTAL | `:22-60` mapeia `s.activeCalls`; `:28` seleção funcional | `SupervisorPanel.tsx:3,20` | `call_sessions` via hook (`useSupervisorPanel.ts:110`) | — |
| supervisor/panel/BargeInBanner.tsx | ✅ IMPLEMENTADO_TOTAL | `:19` `onClick={s.endBargeIn}` → UPDATE real (`useSupervisorPanel.ts:188`) | `SupervisorPanel.tsx:4,19` | `barge_in_sessions` | — |
| supervisor/panel/CallActionTabs.tsx | 🟨 IMPLEMENTADO_PARCIAL | Whisper persiste (`useSupervisorPanel.ts:167` INSERT `whisper_messages`); Barge-in persiste (`:178` INSERT `barge_in_sessions`). **Aba "Escuta" (`:34-46`) não tem nenhum controle** — só texto e um Badge decorativo `:41-43` "Áudio recebido pelo canal SIP do supervisor" | `SupervisorPanel.tsx:5,21` | `whisper_messages`, `barge_in_sessions` | Escuta silenciosa: nenhum botão, nenhuma chamada de API, nenhum stream. Promessa de UI sem implementação |
| supervisor/panel/PanelHeader.tsx | ✅ IMPLEMENTADO_TOTAL | `:24-25` liga sound managers; `:33` toggle de som real | `SupervisorPanel.tsx:6,15` | estado do hook | — |
| supervisor/panel/QueueMetricsGrid.tsx | ✅ IMPLEMENTADO_TOTAL | `:45-68` consome `SupervisorQueueMetrics` calculado de queries reais (`useSupervisorPanel.ts:117-118`) | `SupervisorPanel.tsx:7,17` | `call_sessions` (completed/abandoned do dia) | — |
| supervisor/panel/TrendChartToggle.tsx | 🟨 IMPLEMENTADO_PARCIAL | `:9-17` collapsible funcional, mas `:19` renderiza o `QueueTrendChart` aleatório | `SupervisorPanel.tsx:8,18` | — | Herda o defeito do gráfico fictício |
| supervisor/panel/types.ts | ✅ IMPLEMENTADO_TOTAL | `:3` `ReturnType<typeof useSupervisorPanel>` | 5 arquivos do próprio diretório (`ActiveCallsList:5`, `BargeInBanner:3`, `PanelHeader:8`, `CallActionTabs:7`, `TrendChartToggle:5`) | — | — |
| **translation/LiveTranslationPanel.tsx** | ⬛ MORTO_OU_ABANDONADO | 125 linhas completas e funcionais (`:25` `useLiveTranslation`, `:26` `useCulturalHints`, hooks existem em `src/hooks/`), mas **zero importadores** — os 3 padrões de grep retornaram vazio; é o único arquivo de `src/components/translation/` | **ÓRFÃO** | `useLiveTranslation` / `useCulturalHints` | Nunca montado em nenhuma página. Feature de tradução ao vivo construída e não plugada |
| **whatsapp/WhatsappComposer.tsx** | ⬛ MORTO_OU_ABANDONADO | 106 linhas funcionais (`:42,47` `useWhatsappRewrite` existe), mas **zero importadores** nos 3 padrões; único arquivo de `src/components/whatsapp/` | **ÓRFÃO** | `useWhatsappRewrite` (Lovable AI Gateway, doc `:32`) | Nunca montado. Feature "Melhorar com IA" inacessível ao usuário |
| voice/VoiceAssistantDialog.tsx | ✅ IMPLEMENTADO_TOTAL | 550 linhas; `:39` `useVoiceCommand`, `:59` `useVoicePreferences`, `:94-110` parse+despacho de intent, `:191-197` timeout de mic, `:175-192` atalhos teclado, `:213` portal | `pages/PhoneDialer.tsx:18,313` | Web Speech API + `useVoiceCommand`/`useVoicePreferences` | — |
| voice/VoiceAssistantOrb.tsx | ✅ IMPLEMENTADO_TOTAL | `:10` doc "puramente visual"; `aria-hidden` `:16,49` | `pages/PhoneDialer.tsx:19,310` | — (decorativo por contrato) | `VoiceWaveform` (`:46`) exportado e sem consumidor |
| voice/overlay/VoiceOrb.tsx | ✅ IMPLEMENTADO_TOTAL | `:12` recebe `phase`/`isBooting`; `:4` compõe efeitos | `VoiceAssistantDialog.tsx:10,295` | `usePhaseColors` | — |
| voice/overlay/FloatingParticles.tsx | ✅ IMPLEMENTADO_TOTAL | `Math.random` em `:51-62,105-106` é **simulação física de partículas**, não métrica; canvas decorativo | `VoiceAssistantDialog.tsx:9,233` | — | — |
| voice/overlay/VoiceVisualEffects.tsx | ✅ IMPLEMENTADO_TOTAL | 4 exports, todos consumidos: `FlowingWaveRing`/`ParticleField`/`LightRays` por `VoiceOrb.tsx:4`; `SpectrumWaveform` por `VoiceAssistantDialog.tsx:11` | idem | — | `SpectrumWaveform:199-202` usa `seededRandom(777)` — barras não refletem áudio real, mas é `aria-hidden` (`:205`) e declaradamente ornamental |
| voice/overlay/usePhaseColors.ts | ✅ IMPLEMENTADO_TOTAL | `:8` lê `--primary` do tema; `:39` `MutationObserver` reativo | `VoiceAssistantDialog.tsx:12,195`, `VoiceOrb.tsx`, `FloatingParticles.tsx`, `VoiceVisualEffects` | CSS custom properties | — |
| voice/voice-intent.ts | ✅ IMPLEMENTADO_TOTAL | `:34-57` parser PT-BR determinístico; `:60-76` `describeIntent` | `VoiceAssistantDialog.tsx:13`; `pages/PhoneDialer.tsx:20`; teste `dialer/phone/__tests__/phone-dialer.test.ts:8` | — (puro) | — |

### Bloco `src/components/ui/*` (57 arquivos)

**Autorais (não-shadcn) — 8 arquivos:**

| Componente | Classificação | Evidência | Consumidor | O que falta |
|---|---|---|---|---|
| ui/VirtualList.tsx | ✅ | `:28-33` `useVirtualizer` real | `contacts/ContactHistoryTab`, `call-history/CallSessionsList`, `dialer/AddContactsDialog` | — |
| ui/search-input.tsx | ✅ | `:66` onChange, `:67-72` Esc, `:82` limpar | 6 consumidores (`pages/Voicemail`, `Recordings`, `Contacts`…) + teste | — |
| ui/empty-state.tsx | 🟨 | Base `EmptyState` usada em 12 arquivos; ações reais `:196-233` (`action.onClick`/`href`) | `notifications/NotificationBell`, `dashboard/RecentCalls`… | 3 dos 5 wrappers são código morto: `EmptySearchState:244`, `EmptyErrorState:268`, `EmptyContactsState:297` — 0 consumidores |
| ui/skeleton-loader.tsx | 🟨 | 13 exports; só `SkeletonDashboard:220` é importado (`App.tsx:13`) | `App.tsx` | 11 exports mortos: `SkeletonText:17`, `SkeletonCard:39`, `SkeletonStatsCard:57`, `SkeletonChart:75`, `SkeletonTable:103`, `SkeletonList:147`, `SkeletonAvatar:170`, `SkeletonButton:189`, `SkeletonBadge:207`, `SkeletonInput:213`, `SkeletonCallCard:257` |
| ui/keyboard-navigation.tsx | 🟨 | 281 linhas; só `SkipLink:223` é importado (`layout/AppLayout.tsx:12`) | `AppLayout.tsx` | 4 exports mortos: `useKeyboardNavigation:16`, `useGlobalShortcuts:138`, `useFocusTrap:164`, `KeyboardShortcut:243`. Infra de acessibilidade construída e não usada |
| ui/breadcrumb-nav.tsx | ✅ | `:66-82` deriva breadcrumb do `useLocation`; `Link` reais `:95,119,162` | `layout/AppLayout.tsx:10,11` (`BreadcrumbNav` + `BreadcrumbCompact`) | Não usa `ui/breadcrumb.tsx` (implementação própria) |
| **ui/animations.tsx** | ⬛ | 35 linhas; `fadeIn:5`, `slideUp:11`, `scale:17`, `AnimatedDiv:30` — nenhum símbolo importado em lugar algum (as ocorrências de "scale" no resto do `src/` são a prop CSS/framer, não o export) | **ÓRFÃO** | Remover ou adotar |
| ui/__tests__/search-input.test.tsx | ✅ | Suíte real com 5 casos (`:3` importa `../search-input`) | — (arquivo de teste) | — |

**Primitivos shadcn/Radix — 49 arquivos.** Wrappers finos sobre Radix/libs, sem
lógica de negócio nem dados. Todos íntegros. Distribuição:

- **Amplamente consumidos (≥20 importadores):** `button` (239), `card` (229),
  `badge` (201), `input` (90), `select` (69), `label` (66), `skeleton` (54),
  `scroll-area` (49), `tabs` (47), `dialog` (47), `switch` (30), `progress` (29),
  `table` (27), `tooltip` (24), `textarea` (23), `alert` (20).
- **Consumo moderado (2-13):** `dropdown-menu` (10), `popover` (10), `slider` (10),
  `checkbox` (8), `alert-dialog` (7), `separator` (7), `sheet` (7), `avatar` (4),
  `calendar` (3), `collapsible` (3), `sidebar` (2), `toast` (2), `use-toast` (2),
  `toggle-group` (2).
- **Consumo único:** `accordion` (`coaching/CoachingPanel`), `command`
  (`layout/CommandPalette`), `form` (`contacts/CreateContactDialog`),
  `radio-group` (`admin/extensions/BulkAssignTrunkDialog`), `sonner` e `toaster`
  (`App.tsx`), `toggle` (só por `toggle-group.tsx:2` — vivo transitivamente).

- ⬛ **Nunca importados (13 arquivos, ~1.100 linhas mortas)** — confirmado pelos
  3 padrões de grep, sem barrel `index.ts` no diretório:
  `aspect-ratio.tsx` (5), `breadcrumb.tsx` (90), `carousel.tsx` (224),
  `chart.tsx` (309), `context-menu.tsx` (178), `drawer.tsx` (87),
  `hover-card.tsx` (27), `input-otp.tsx` (61), `menubar.tsx` (207),
  `navigation-menu.tsx` (120), `pagination.tsx` (81), `resizable.tsx` (35),
  + `animations.tsx` (35, autoral).
  Cada um arrasta dependência de runtime declarada em `package.json`:
  `embla-carousel-react:64`, `recharts:86`, `vaul:92`, `input-otp:67`,
  `react-resizable-panels:84`.
  Observação: `chart.tsx` está morto mas `recharts` é usado **diretamente** em
  outros componentes (`admin/voip/TrunkMetricsTab.tsx:7`,
  `security-alerts/AlertsDailyChart.tsx:11`) — ou seja, o wrapper de tema foi
  escrito e ignorado, e cada gráfico reimplementa o estilo por conta própria.

## Achados graves

1. **⬛ Gráfico de tendência de filas exibe números aleatórios ao supervisor.**
   `supervisor/QueueTrendChart.tsx:23-24` gera `waiting` e `active` com
   `Math.floor(Math.random()*…)` a cada montagem. O comentário `:16` admite
   "Generate sample trend data from recent call sessions", e `supabase` é
   importado em `:3` mas **nunca chamado** — a intenção de buscar dado real foi
   abandonada. O componente está em produção via
   `panel/TrendChartToggle.tsx:19` → `SupervisorPanel.tsx:18` →
   `pages/Index.tsx:14`, sob o rótulo "Tendência do Dia"
   (`TrendChartToggle.tsx:13`) e legendas "Em espera"/"Ativas"
   (`QueueTrendChart.tsx:36,39`). **Um supervisor pode tomar decisão operacional
   sobre ruído.** É o achado mais severo do lote: os demais painéis do mesmo card
   (`QueueMetricsGrid`) usam dados reais, o que aumenta a credibilidade aparente
   do gráfico falso.

2. **🟨 Aba "Escuta silenciosa" é uma promessa sem implementação.**
   `panel/CallActionTabs.tsx:34-46`: a aba renderiza ícone, título "Modo Escuta
   silenciosa", texto explicativo e um `Badge` afirmando "Áudio recebido pelo
   canal SIP do supervisor" (`:41-43`). Não há botão, handler, chamada de API nem
   stream de áudio — nenhum efeito. As outras duas abas do mesmo componente
   (Whisper `:69`, Barge-in `:105`) persistem em Supabase, o que torna a
   assimetria invisível ao usuário: as três aparentam ser recursos equivalentes.

3. **⬛ Duas features completas e desconectadas da aplicação.**
   `translation/LiveTranslationPanel.tsx` (125 linhas) e
   `whatsapp/WhatsappComposer.tsx` (106 linhas) são funcionalmente completos —
   consomem hooks que existem (`useLiveTranslation`, `useCulturalHints`,
   `useWhatsappRewrite`) — mas nenhum arquivo do projeto os importa, por nenhum
   dos três padrões testados. São os únicos arquivos dos respectivos diretórios,
   ou seja, os diretórios `src/components/translation/` e
   `src/components/whatsapp/` inteiros estão mortos. Os hooks correspondentes em
   `src/hooks/` também ficam sem consumidor de UI.

4. **🟨 Infra de acessibilidade construída e engavetada.**
   `ui/keyboard-navigation.tsx` tem 281 linhas com `useKeyboardNavigation:16`,
   `useGlobalShortcuts:138` e `useFocusTrap:164` — nenhum consumido. Só
   `SkipLink:223` é usado (`layout/AppLayout.tsx:12`). Diálogos e overlays do
   projeto (ex.: `VoiceAssistantDialog`) reimplementam captura de teclado à mão
   (`VoiceAssistantDialog.tsx:175-192`) em vez de usar o `useFocusTrap` existente.

5. **⬛ ~1.100 linhas de primitivos shadcn nunca importados**, listadas acima,
   carregando 5 dependências de runtime em `package.json`. Caso mais claro de
   desperdício: `ui/chart.tsx` (309 linhas, wrapper de tema para recharts) está
   morto enquanto dois outros componentes usam `recharts` cru
   (`admin/voip/TrunkMetricsTab.tsx:7`, `security-alerts/AlertsDailyChart.tsx:11`).

6. **🟦 Falsos positivos verificados (NÃO são dado fictício).** Registrado para
   evitar re-flag em auditoria futura:
   - `ui/sidebar.tsx:537` e `ui/skeleton-loader.tsx:88` usam `Math.random()` para
     variar a largura de barras de **skeleton de carregamento** — placeholder
     visual, não métrica. `sidebar.tsx:535` traz o comentário upstream do shadcn.
   - `voice/overlay/FloatingParticles.tsx:51-62,105-106` usa `Math.random()` como
     simulação física de partículas em canvas decorativo.
   - `voice/overlay/VoiceVisualEffects.tsx:199-202` (`SpectrumWaveform`) usa
     `seededRandom(777)`: as barras do "espectro" **não** refletem amplitude real
     do microfone. É ornamental e marcado `aria-hidden` (`:205`), mas vale notar
     que visualmente sugere análise de áudio ao vivo que não ocorre.
   - `settings/VoipSettings.tsx` é um card de navegação, não um formulário morto:
     a rota destino existe (`routes/protectedRoutes.tsx:191`).

7. **Import morto residual:** `settings/SystemLogs.tsx:6` importa
   `formatDistanceToNow` de `date-fns` que foi substituído por
   `safeFormatDistanceToNow` (`:1`, usado em `:55`) e nunca é chamado.

## Integrações de terceiros observadas

| Integração | Onde | Situação |
|---|---|---|
| Supabase (Postgres) | `SystemLogs.tsx:13` (`audit_logs`), `useSupervisorPanel.ts:110,117,118,133,138` (`call_sessions`, `barge_in_sessions`, `whisper_messages`) | Ativa; tabelas confirmadas em `integrations/supabase/types.ts:580` |
| Supabase Edge Functions | `SystemMaintenancePanel.tsx:25` — `check-alerts`, `check-hold-alerts`, `check-queue-metrics`, `database-backup`, `database-cleanup`, `process-digest` | Ativa (invocação manual pelo painel) |
| Supabase RPC | `SystemMaintenancePanel.tsx:29` `log_audit_event`; existe em `types.ts:7582` | Ativa |
| Lovable AI Gateway | `whatsapp/WhatsappComposer.tsx:32` (doc) via `useWhatsappRewrite` | **Inalcançável** — componente órfão |
| Web Speech API (STT/TTS) | `VoiceAssistantDialog.tsx:8` (`lib/voice-speech`: `speak`/`cancelSpeech`/`isSpeechSupported`), `:39` `useVoiceCommand` | Ativa em `pages/PhoneDialer.tsx` |
| Edge `voice-command` | `voice/voice-intent.ts:3` (comentário: camada rápida antes/depois da edge) | Parser local ativo; edge referenciada só em comentário neste lote |
| Radix UI | 44 primitivos em `ui/` | Ativa (13 arquivos nunca importados) |
| framer-motion | `package.json:66`; `VoiceAssistantDialog`, `voice/overlay/*`, `VoiceAssistantOrb`, `ui/animations.tsx` | Ativa |
| recharts | `package.json:86`; `ui/chart.tsx` (morto) vs. uso direto em `admin/voip/TrunkMetricsTab.tsx:7`, `security-alerts/AlertsDailyChart.tsx:11` | Ativa por fora do wrapper |
| @tanstack/react-query | `SystemLogs.tsx:2`, `SystemMaintenancePanel.tsx:7` | Ativa |
| @tanstack/react-virtual | `package.json:50`; `ui/VirtualList.tsx:2` | Ativa (3 consumidores) |
| sonner (toasts) | `package.json:87`; `SystemMaintenancePanel.tsx:8`, `ui/sonner.tsx` → `App.tsx` | Ativa |
| cmdk | `package.json:62`; `ui/command.tsx` → `layout/CommandPalette` | Ativa |
| react-day-picker | `package.json:79`; `ui/calendar.tsx` → 3 consumidores | Ativa |
| react-router-dom | `VoipSettings.tsx:4`, `ui/breadcrumb-nav.tsx:1` | Ativa |
| embla-carousel-react | `package.json:64` → `ui/carousel.tsx` | **Dependência órfã** |
| vaul | `package.json:92` → `ui/drawer.tsx` | **Dependência órfã** |
| input-otp | `package.json:67` → `ui/input-otp.tsx` | **Dependência órfã** |
| react-resizable-panels | `package.json:84` → `ui/resizable.tsx` | **Dependência órfã** |
| vitest + @testing-library | `ui/__tests__/search-input.test.tsx:1-2` | Presente (não executado nesta auditoria) |
