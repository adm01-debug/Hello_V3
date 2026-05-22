import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const AnalyzeCallSchema = z.object({
  transcript: z.string().min(1, "Transcrição é obrigatória").max(50000),
  callInfo: z.object({
    contactName: z.string().optional(),
    phone: z.string().optional(),
    duration: z.string().optional(),
    type: z.string().optional()
  }).optional()
});

export type AnalyzeCall = z.infer<typeof AnalyzeCallSchema>;
