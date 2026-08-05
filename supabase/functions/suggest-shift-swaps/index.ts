import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: buildCorsHeaders(req) });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });

    // Valida role
    const { data: profile } = await admin.from('user_profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Busca shifts próximos 7 dias + weekly stats
    const in7 = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const { data: shifts } = await admin
      .from('agent_shifts')
      .select('id, agent_id, starts_at, ends_at')
      .gte('starts_at', new Date().toISOString())
      .lte('starts_at', in7)
      .limit(500);

    const { data: stats } = await admin
      .from('agent_weekly_stats')
      .select('agent_id, avg_call_score, adherence_percent, total_calls');

    const statsMap = new Map((stats ?? []).map((s) => [s.agent_id, s]));

    // Detecta picos previstos: hora com mais shifts do que capacidade média
    const hourBuckets: Record<string, string[]> = {};
    for (const s of shifts ?? []) {
      const key = new Date(s.starts_at).toISOString().slice(0, 13);
      hourBuckets[key] ??= [];
      hourBuckets[key].push(s.id);
    }

    // Sugestões: agentes com baixo score em turno de pico → trocar com agentes de alto score em turno de baixa
    const suggestions: Array<{ from_agent_id: string; to_agent_id: string; from_shift_id: string; to_shift_id: string; score: number; reason: string; metadata: unknown }> = [];

    const hoursSorted = Object.entries(hourBuckets).sort(([, a], [, b]) => b.length - a.length);
    const peakHours = hoursSorted.slice(0, 3);
    const lowHours = hoursSorted.slice(-3);

    for (const [peakKey, peakShiftIds] of peakHours) {
      for (const peakShiftId of peakShiftIds) {
        const peakShift = shifts!.find((s) => s.id === peakShiftId);
        if (!peakShift) continue;
        const peakStat = statsMap.get(peakShift.agent_id);
        if (!peakStat || (peakStat.avg_call_score ?? 100) >= 75) continue;

        // Procura substituto em hora de baixa
        for (const [lowKey, lowShiftIds] of lowHours) {
          for (const lowShiftId of lowShiftIds) {
            const lowShift = shifts!.find((s) => s.id === lowShiftId);
            if (!lowShift || lowShift.agent_id === peakShift.agent_id) continue;
            const lowStat = statsMap.get(lowShift.agent_id);
            if (!lowStat || (lowStat.avg_call_score ?? 0) < 80) continue;

            const scoreGain = (lowStat.avg_call_score ?? 0) - (peakStat.avg_call_score ?? 0);
            if (scoreGain < 15) continue;

            suggestions.push({
              from_agent_id: peakShift.agent_id,
              to_agent_id: lowShift.agent_id,
              from_shift_id: peakShift.id,
              to_shift_id: lowShift.id,
              score: Number(scoreGain.toFixed(2)),
              reason: `Pico previsto ${peakKey}: agente com score ${peakStat.avg_call_score} substituído por agente ${lowStat.avg_call_score} do horário de baixa ${lowKey}`,
              metadata: { peakKey, lowKey, peakScore: peakStat.avg_call_score, lowScore: lowStat.avg_call_score },
            });
            break;
          }
          if (suggestions.length >= 10) break;
        }
        if (suggestions.length >= 10) break;
      }
      if (suggestions.length >= 10) break;
    }

    let inserted = 0;
    if (suggestions.length > 0) {
      const { error } = await admin.from('shift_swap_suggestions').insert(suggestions);
      if (!error) inserted = suggestions.length;
    }

    return new Response(JSON.stringify({ analyzed_shifts: shifts?.length ?? 0, suggestions_created: inserted }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
