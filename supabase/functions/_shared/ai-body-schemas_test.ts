import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  GenerateCoachingBodySchema,
  GenerateCoachingPlanBodySchema,
  GenerateMeetingSummaryBodySchema,
  GenerateSummaryBodySchema,
  OcrVirtualFaxBodySchema,
  PROMPT_TEXT_MAX,
  ScoreCallBodySchema,
  SendSurveyBodySchema,
  TranscribeRecordingBodySchema,
  TranslateSummaryBodySchema,
  TranslateUtteranceBodySchema,
  UTTERANCE_TEXT_MAX,
  VerifyVoiceBodySchema,
  VOICE_COMMAND_TEXT_MAX,
  VoiceCommandBodySchema,
} from "./ai-body-schemas.ts";

function firstField(result: { success: boolean; error?: { errors: { path: (string | number)[] }[] } }) {
  return result.error?.errors[0]?.path.join(".");
}

Deno.test("score-call: id acima do teto e recusado", () => {
  assertEquals(ScoreCallBodySchema.safeParse({ callSessionId: "a".repeat(101), templateId: "t" }).success, false);
  assertEquals(ScoreCallBodySchema.safeParse({ callSessionId: "s", templateId: "t" }).success, true);
});

Deno.test("score-call: corpo vazio e recusado (422 em vez de cair no banco)", () => {
  const r = ScoreCallBodySchema.safeParse({});
  assertEquals(r.success, false);
  assertEquals(firstField(r), "callSessionId");
});

Deno.test("generate-summary: texto de transcricao acima do teto do prompt e recusado", () => {
  const r = GenerateSummaryBodySchema.safeParse({
    callInfo: { transcripts: [{ speaker: "agent", text: "x".repeat(PROMPT_TEXT_MAX + 1) }] },
  });
  assertEquals(r.success, false);
  assertEquals(firstField(r), "callInfo.transcripts.0.text");
});

Deno.test("generate-summary: corpo valido passa e o vazio continua aceito (fallback de sem transcricao)", () => {
  const ok = GenerateSummaryBodySchema.safeParse({
    callInfo: { transcripts: [{ speaker: "agent", text: "bom dia" }], callerName: "Ana", duration: 120 },
  });
  assertEquals(ok.success, true);
  assertEquals(GenerateSummaryBodySchema.safeParse({}).success, true);
});

Deno.test("generate-summary: mais de 200 segmentos de transcricao e recusado", () => {
  const transcripts = Array.from({ length: 201 }, () => ({ speaker: "agent", text: "oi" }));
  assertEquals(GenerateSummaryBodySchema.safeParse({ callInfo: { transcripts } }).success, false);
});

Deno.test("generate-coaching: agentId e obrigatorio", () => {
  assertEquals(GenerateCoachingBodySchema.safeParse({}).success, false);
  assertEquals(GenerateCoachingBodySchema.safeParse({ agentId: "u-1" }).success, true);
});

Deno.test("generate-coaching-plan e generate-meeting-summary: vazio preserva o 400 do handler", () => {
  assertEquals(GenerateCoachingPlanBodySchema.safeParse({}).success, true);
  assertEquals(GenerateCoachingPlanBodySchema.safeParse({ agent_name: "a".repeat(101) }).success, false);
  assertEquals(GenerateMeetingSummaryBodySchema.safeParse({}).success, true);
  assertEquals(GenerateMeetingSummaryBodySchema.safeParse({ force: true }).success, true);
  assertEquals(GenerateMeetingSummaryBodySchema.safeParse({ force: "true" }).success, false);
});

Deno.test("translate-summary: targetLang acima do teto e recusado", () => {
  assertEquals(TranslateSummaryBodySchema.safeParse({ callSessionId: "s", targetLang: "x".repeat(20) }).success, false);
  assertEquals(TranslateSummaryBodySchema.safeParse({ callSessionId: "s", targetLang: "en" }).success, true);
});

Deno.test("translate-utterance: texto ao vivo acima do teto e recusado", () => {
  assertEquals(
    TranslateUtteranceBodySchema.safeParse({
      callSessionId: "s",
      text: "x".repeat(UTTERANCE_TEXT_MAX + 1),
      targetLang: "en",
    }).success,
    false,
  );
  const ok = TranslateUtteranceBodySchema.safeParse({
    callSessionId: "s",
    text: "bom dia",
    targetLang: "en",
    speaker: "customer",
  });
  assertEquals(ok.success, true);
});

Deno.test("translate-utterance: speaker fora da lista e recusado", () => {
  assertEquals(
    TranslateUtteranceBodySchema.safeParse({ callSessionId: "s", text: "oi", targetLang: "en", speaker: "bot" }).success,
    false,
  );
});

Deno.test("voice-command: audio acima do teto do prompt e recusado", () => {
  assertEquals(VoiceCommandBodySchema.safeParse({ audio: "x".repeat(VOICE_COMMAND_TEXT_MAX + 1) }).success, false);
  assertEquals(VoiceCommandBodySchema.safeParse({ audio: "abrir o painel" }).success, true);
  assertEquals(VoiceCommandBodySchema.safeParse({}).success, true);
});

Deno.test("verify-voice: embedding acima de 1024 dims e recusado, vazio preserva o 400", () => {
  const big = Array.from({ length: 1025 }, () => 0.1);
  assertEquals(VerifyVoiceBodySchema.safeParse({ embedding: big }).success, false);
  assertEquals(VerifyVoiceBodySchema.safeParse({}).success, true);
  assert(VerifyVoiceBodySchema.safeParse({ embedding: [0.1, 0.2], label: "primary" }).success);
});

Deno.test("transcribe-recording: filePath e recordingId tem teto", () => {
  assertEquals(TranscribeRecordingBodySchema.safeParse({ recordingId: "r", filePath: "a".repeat(513) }).success, false);
  assertEquals(TranscribeRecordingBodySchema.safeParse({}).success, true);
});

Deno.test("ocr-virtual-fax: fax_id tem teto e o vazio preserva o 400", () => {
  assertEquals(OcrVirtualFaxBodySchema.safeParse({ fax_id: "f".repeat(101) }).success, false);
  assertEquals(OcrVirtualFaxBodySchema.safeParse({}).success, true);
});

Deno.test("send-survey: ids e canal tem teto, vazio preserva o 400", () => {
  assertEquals(SendSurveyBodySchema.safeParse({ channel: "x".repeat(31) }).success, false);
  assertEquals(SendSurveyBodySchema.safeParse({ survey_id: "s".repeat(101) }).success, false);
  assertEquals(SendSurveyBodySchema.safeParse({}).success, true);
});