import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, optional } from "../_shared/validate.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";
import { averageEmbeddings } from "../_shared/voice-utils.ts";

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

    const rl = await checkRateLimitDB(getClientIp(req), 'enroll-voice', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    // body.embedding: number[] (uma amostra) ou number[][] (múltiplas)
    const labelParsed = validate({ label: body.label ?? 'primary' }, {
      label: optional(string({ max: 64 })),
    });
    if (!labelParsed.ok) {
      return new Response(JSON.stringify({ error: 'Dados inválidos', details: labelParsed.errors }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let samples: number[][] = [];
    if (Array.isArray(body.embedding) && Array.isArray(body.embedding[0])) {
      samples = body.embedding as number[][];
    } else if (Array.isArray(body.embedding)) {
      samples = [body.embedding as number[]];
    }
    if (samples.length === 0 || !samples.every((s) => Array.isArray(s) && s.length >= 8 && s.length <= 1024)) {
      return new Response(JSON.stringify({ error: 'Embedding inválido (8-1024 dims)' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const centroid = averageEmbeddings(samples);
    const summary = (body.summary && typeof body.summary === 'object') ? body.summary : null;
    const label = (labelParsed.data.label as string) ?? 'primary';

    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Upsert por (user_id, label)
    const { data: existing } = await adminClient.from('voice_prints')
      .select('id, embedding, sample_count')
      .eq('user_id', user.id).eq('label', label).maybeSingle();

    let result;
    if (existing) {
      const merged = averageEmbeddings([existing.embedding as number[], centroid]);
      const { data, error } = await adminClient.from('voice_prints')
        .update({
          embedding: merged,
          feature_summary: summary,
          sample_count: (existing.sample_count ?? 1) + samples.length,
          is_active: true,
        })
        .eq('id', existing.id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await adminClient.from('voice_prints')
        .insert({
          user_id: user.id,
          label,
          embedding: centroid,
          feature_summary: summary,
          sample_count: samples.length,
        }).select().single();
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ success: true, voicePrint: result }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro interno', message: String(e) }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
