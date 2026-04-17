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

    const body = await req.json().catch(() => ({}));
    const result = validate(body, { contact_id: optional(string()) });
    if (!result.ok) return json({ error: 'Validation failed', details: result.errors }, 400, cors);

    const targetContactId = result.data.contact_id;

    // Buscar contatos a processar
    let contactQuery = supabase.from('contacts').select('id, phone');
    if (targetContactId) contactQuery = contactQuery.eq('id', targetContactId);
    else contactQuery = contactQuery.limit(200);

    const { data: contacts, error: contactsError } = await contactQuery;
    if (contactsError) return json({ error: contactsError.message }, 500, cors);

    let processed = 0;
    const results: Array<{ contact_id: string; best_hour: number | null; answer_rate: number }> = [];

    for (const contact of contacts ?? []) {
      const { data: sessions } = await supabase
        .from('call_sessions')
        .select('started_at, duration_seconds, status')
        .eq('contact_id', contact.id)
        .order('started_at', { ascending: false })
        .limit(500);

      if (!sessions || sessions.length === 0) continue;

      const hourly: Record<number, { attempts: number; answered: number }> = {};
      const daily: Record<number, { attempts: number; answered: number }> = {};
      let totalAnswered = 0;
      let totalDuration = 0;
      let lastAttemptAt: string | null = null;
      let lastAnsweredAt: string | null = null;

      for (const s of sessions) {
        const d = new Date(s.started_at);
        const hour = d.getHours();
        const dow = d.getDay();
        const answered = (s.duration_seconds ?? 0) > 5 && s.status !== 'failed';

        hourly[hour] = hourly[hour] ?? { attempts: 0, answered: 0 };
        daily[dow] = daily[dow] ?? { attempts: 0, answered: 0 };
        hourly[hour].attempts++;
        daily[dow].attempts++;

        if (answered) {
          hourly[hour].answered++;
          daily[dow].answered++;
          totalAnswered++;
          totalDuration += s.duration_seconds ?? 0;
          if (!lastAnsweredAt || s.started_at > lastAnsweredAt) lastAnsweredAt = s.started_at;
        }
        if (!lastAttemptAt || s.started_at > lastAttemptAt) lastAttemptAt = s.started_at;
      }

      // Determinar melhor hora e dia (maior taxa de atendimento com pelo menos 2 tentativas)
      let bestHour: number | null = null;
      let bestHourRate = 0;
      for (const [h, stats] of Object.entries(hourly)) {
        if (stats.attempts < 2) continue;
        const rate = stats.answered / stats.attempts;
        if (rate > bestHourRate) { bestHourRate = rate; bestHour = parseInt(h); }
      }

      let bestDay: number | null = null;
      let bestDayRate = 0;
      for (const [d, stats] of Object.entries(daily)) {
        if (stats.attempts < 2) continue;
        const rate = stats.answered / stats.attempts;
        if (rate > bestDayRate) { bestDayRate = rate; bestDay = parseInt(d); }
      }

      const answerRate = sessions.length > 0 ? totalAnswered / sessions.length : 0;
      const avgDuration = totalAnswered > 0 ? Math.round(totalDuration / totalAnswered) : 0;

      const payload = {
        contact_id: contact.id,
        best_hour: bestHour,
        best_day_of_week: bestDay,
        answer_rate: parseFloat(answerRate.toFixed(4)),
        total_attempts: sessions.length,
        total_answered: totalAnswered,
        avg_call_duration_seconds: avgDuration,
        hourly_distribution: hourly,
        daily_distribution: daily,
        last_attempt_at: lastAttemptAt,
        last_answered_at: lastAnsweredAt,
        computed_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from('contact_engagement_patterns')
        .upsert(payload, { onConflict: 'contact_id' });

      if (!upsertErr) {
        processed++;
        results.push({ contact_id: contact.id, best_hour: bestHour, answer_rate: answerRate });
      }
    }

    return json({ success: true, processed, results }, 200, cors);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500, cors);
  }
});

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
