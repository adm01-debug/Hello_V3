import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Tetos do que vira prompt (A-129 / etapa 048). Acima do teto a edge responde 422 em vez
// de truncar: truncar em silencio gera resumo errado, o que e pior que recusar o payload.
export const PROMPT_TEXT_MAX = 20_000;
export const UTTERANCE_TEXT_MAX = 5_000;
export const VOICE_COMMAND_TEXT_MAX = 4_000;
export const ID_MAX = 100;
export const STORAGE_PATH_MAX = 512;

const id = z.string().max(ID_MAX);
const requiredId = z.string().min(1).max(ID_MAX);
const lang = z.string().max(10);

export const ScoreCallBodySchema = z.object({
  callSessionId: requiredId,
  templateId: requiredId,
});

export const GenerateSummaryBodySchema = z.object({
  callInfo: z
    .object({
      transcripts: z
        .array(
          z.object({
            speaker: z.string().max(50),
            text: z.string().max(PROMPT_TEXT_MAX),
          }),
        )
        .max(200)
        .optional(),
      callerName: z.string().max(200).optional(),
      duration: z.number().min(0).max(86_400).optional(),
    })
    .optional(),
});

export const GenerateCoachingBodySchema = z.object({
  agentId: requiredId,
});

export const GenerateCoachingPlanBodySchema = z.object({
  agent_name: id.optional(),
});

export const GenerateMeetingSummaryBodySchema = z.object({
  callSessionId: id.optional(),
  force: z.boolean().optional(),
});

export const TranslateSummaryBodySchema = z.object({
  callSessionId: id.optional(),
  targetLang: lang.optional(),
});

export const TranslateUtteranceBodySchema = z.object({
  callSessionId: id.optional(),
  text: z.string().max(UTTERANCE_TEXT_MAX).optional(),
  speaker: z.enum(["agent", "customer"]).optional(),
  sourceLang: lang.optional(),
  targetLang: lang.optional(),
  segmentId: id.optional(),
});

export const VoiceCommandBodySchema = z.object({
  audio: z.string().max(VOICE_COMMAND_TEXT_MAX).optional(),
});

export const VerifyVoiceBodySchema = z.object({
  embedding: z.array(z.unknown()).max(1024).optional(),
  callSessionId: id.optional(),
  label: z.string().max(50).optional(),
});

export const TranscribeRecordingBodySchema = z.object({
  recordingId: id.optional(),
  filePath: z.string().max(STORAGE_PATH_MAX).optional(),
});

export const OcrVirtualFaxBodySchema = z.object({
  fax_id: id.optional(),
});

export const SendSurveyBodySchema = z.object({
  survey_id: id.optional(),
  account_id: id.optional(),
  contact_id: id.optional(),
  call_session_id: id.optional(),
  channel: z.string().max(30).optional(),
});