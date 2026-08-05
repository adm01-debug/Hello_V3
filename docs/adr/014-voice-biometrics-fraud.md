# ADR-014: Voice Biometrics & Fraud Detection

## Status
Aceito — 2026-04-17

## Contexto
Concorrentes (Pindrop, Nuance Gatekeeper, ID R&D) oferecem autenticação biométrica de voz e detecção de fraude em tempo real, especialmente relevante para call centers de finanças e saúde.

## Decisão
- **Biometria leve client-side**: extração de 64-dim embedding via `AnalyserNode` (FFT estatístico). Não compete com modelos comerciais, mas estabelece linha de base sem custo de inferência.
- **Verificação por similaridade cosseno** vs baseline armazenado em `voice_prints.confidence_baseline` (default 0.85).
- **Fraud signals automáticos**: mismatch de voz durante chamada gera `fraud_signals` (severity calculado por delta de similaridade).
- **Redação PCI baseada em transcrição**: regex PT-BR sobre `call_transcriptions` marca segmentos com timestamps; áudio real será re-encodado por job batch (out of scope para edge function Deno).

## Tabelas
- `voice_prints` (RLS: dono ou admin)
- `fraud_signals` (RLS: admin/supervisor full, agent só nas próprias calls)
- `redaction_log` (RLS: admin only)

## Edge Functions
- `enroll-voice`: aceita 1+ amostras, gera centroide
- `verify-voice`: similaridade + verdict + auto-cria fraud_signal em mismatch
- `redact-sensitive-audio`: scan de transcrição + log

## Consequências
+ MVP funcional sem dependências externas
+ Reuso de `call_sessions` e `call_transcriptions`
- Embedding caseiro tem precisão limitada — caminho futuro: integrar Whisper embeddings ou Resemblyzer
- Redação só marca timestamps; pipeline real de áudio (ffmpeg) fica para v2
