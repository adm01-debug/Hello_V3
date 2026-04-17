---
name: Voice Security
description: Biometria de voz (enroll/verify), fraud signals automáticos em mismatch, redação PCI de transcrições PT-BR. Página /voice-security com 3 tabs.
type: feature
---

Suíte Voice Biometrics & Fraud Detection inspirada em Pindrop/Nuance.

- Tabelas: `voice_prints`, `fraud_signals`, `redaction_log`
- Edge functions: `enroll-voice`, `verify-voice`, `redact-sensitive-audio`
- Embedding 64-dim extraído via AnalyserNode (client-side, sem ML pesado)
- Verificação compara cosseno vs `confidence_baseline` (default 0.85)
- Mismatch durante call → cria `fraud_signals` automaticamente
- Redação detecta CPF, CNPJ, cartão, CVV, CEP, telefone PT-BR
- Página `/voice-security` em `src/pages/VoiceSecurity.tsx`
- Hook principal: `useVoiceBiometrics.ts` (useVoicePrints, useFraudSignals, useRedactCall, useLiveVoiceVerification)
- Utilitário client: `src/lib/voice-biometrics.ts` (captureVoiceSample, VOICE_VECTOR_DIM=64)
- Utilitário backend: `supabase/functions/_shared/voice-utils.ts` (cosineSimilarity, REDACTION_PATTERNS)
- ADR: `docs/adr/014-voice-biometrics-fraud.md`
