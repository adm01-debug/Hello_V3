import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string } from "../_shared/validate.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";
import { findSensitiveMatches, maskText } from "../_shared/voice-utils.ts";

/**
 * Marca segmentos sensíveis na transcrição da chamada e gera log de redação.
 * Não re-encoda áudio (custo proibitivo em Deno edge); marca timestamps para
 * processamento posterior por pipeline de áudio (ex.: ffmpeg em job batch).
 */
serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const rl = await checkRateLimitDB(getClientIp(req), 'redact-sensitive-audio', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = validate(body, {
      callSessionId: string({ min: 1, max: 64 }),
    });
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Dados inválidos', details: parsed.errors }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const callSessionId = parsed.data.callSessionId as string;

    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Busca transcrições da chamada (com timestamps)
    const { data: transcripts, error: tErr } = await adminClient
      .from('call_transcriptions')
      .select('id, text, start_time, end_time, speaker')
      .eq('call_session_id', callSessionId)
      .order('start_time', { ascending: true });

    if (tErr) throw tErr;
    if (!transcripts || transcripts.length === 0) {
      return new Response(JSON.stringify({ matches: 0, segments: [], message: 'Sem transcrição' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const segments: Array<{
      transcript_id: string;
      speaker: string;
      start_time: number | null;
      end_time: number | null;
      pattern: string;
      original_text_preview: string;
      masked_text: string;
    }> = [];

    let totalMatches = 0;
    const patternCounts: Record<string, number> = {};

    for (const t of transcripts) {
      const matches = findSensitiveMatches(t.text);
      if (matches.length === 0) continue;
      const masked = maskText(t.text, matches);
      totalMatches += matches.length;
      for (const m of matches) {
        patternCounts[m.pattern] = (patternCounts[m.pattern] ?? 0) + 1;
        segments.push({
          transcript_id: t.id,
          speaker: t.speaker,
          start_time: t.start_time,
          end_time: t.end_time,
          pattern: m.pattern,
          original_text_preview: m.match.slice(0, 4) + '***',
          masked_text: masked.slice(0, 200),
        });
      }
    }

    // Log único agregado
    await adminClient.from('redaction_log').insert({
      call_session_id: callSessionId,
      pattern_type: Object.keys(patternCounts).join(',') || 'none',
      match_count: totalMatches,
      segments,
      status: totalMatches > 0 ? 'completed' : 'no_matches',
    });

    return new Response(JSON.stringify({
      matches: totalMatches,
      patterns: patternCounts,
      segments_count: segments.length,
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro interno', message: String(e) }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
