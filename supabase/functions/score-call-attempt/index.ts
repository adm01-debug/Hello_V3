import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, string, optional } from '../_shared/validate.ts';

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing auth' }, 401, cors);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401, cors);

    const body = await req.json();
    const result = validate(body, {
      contact_id: optional(string()),
      phone: string({ min: 6, max: 30 }),
      region_code: optional(string({ max: 5 })),
    });
    if (!result.ok) return json({ error: 'Validation failed', details: result.errors }, 400, cors);

    const { contact_id, phone, region_code = 'BR' } = result.data;

    // 1. DNC check
    const { data: dncResult } = await supabase.rpc('check_dnc', { p_phone: phone });
    const inDNC = dncResult === true;

    // 2. Calling hours
    const { data: hoursData } = await supabase.rpc('check_calling_hours', { p_region_code: region_code });
    const hoursCheck = hoursData as { can_call: boolean; reason: string } | null;
    const withinHours = hoursCheck?.can_call ?? true;

    // 3. Engagement pattern (se houver contact_id)
    let pattern: { best_hour: number | null; best_day_of_week: number | null; answer_rate: number; total_attempts: number } | null = null;
    if (contact_id) {
      const { data } = await supabase
        .from('contact_engagement_patterns')
        .select('best_hour, best_day_of_week, answer_rate, total_attempts')
        .eq('contact_id', contact_id)
        .maybeSingle();
      pattern = data;
    }

    // Scoring
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    let score = 0.5; // base
    const factors: string[] = [];

    if (inDNC) {
      score = 0;
      factors.push('Número está na lista DNC — NÃO LIGAR');
      return json({
        score: 0, recommendation: 'block', factors,
        dnc: true, within_hours: withinHours, pattern,
      }, 200, cors);
    }

    if (!withinHours) {
      score *= 0.1;
      factors.push(`Fora do horário permitido: ${hoursCheck?.reason ?? 'horário restrito'}`);
    }

    if (pattern && pattern.total_attempts >= 3) {
      // Histórico geral de atendimento
      score = 0.3 + pattern.answer_rate * 0.4;
      factors.push(`Taxa histórica de atendimento: ${(pattern.answer_rate * 100).toFixed(1)}%`);

      // Bônus se hora atual coincide com melhor hora (±1h)
      if (pattern.best_hour !== null && Math.abs(currentHour - pattern.best_hour) <= 1) {
        score += 0.2;
        factors.push(`Hora atual coincide com melhor janela (${pattern.best_hour}h)`);
      }
      // Bônus se dia coincide
      if (pattern.best_day_of_week !== null && currentDay === pattern.best_day_of_week) {
        score += 0.1;
        factors.push('Dia da semana ideal');
      }
    } else {
      factors.push('Sem histórico suficiente — score base aplicado');
    }

    score = Math.max(0, Math.min(1, score));

    const recommendation = score >= 0.7 ? 'high_priority'
      : score >= 0.4 ? 'normal'
      : score >= 0.15 ? 'low_priority'
      : 'defer';

    return json({
      score: parseFloat(score.toFixed(3)), // safe-numeric-ok: valor já validado por schema Zod ou vindo de linha do DB tipada
      recommendation,
      factors,
      dnc: false,
      within_hours: withinHours,
      pattern,
      computed_at: now.toISOString(),
    }, 200, cors);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500, cors);
  }
});

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
