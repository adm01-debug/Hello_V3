import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

interface AgentWeakness {
  agent_name: string;
  weakness: 'objection_handling' | 'empathy' | 'clarity' | 'compliance';
  score: number;
  sample_count: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: buildCorsHeaders(req) });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Lê análises últimas 14d
    const { data: analyses } = await admin
      .from('call_analyses')
      .select('call_session_id, empathy_score, clarity_score, objection_handling_score, compliance_score')
      .gte('created_at', since)
      .limit(2000);

    // Junta com agent_name via call_sessions
    const callIds = (analyses ?? []).map((a) => a.call_session_id).filter(Boolean);
    const { data: sessions } = await admin
      .from('call_sessions')
      .select('id, agent_name')
      .in('id', callIds);

    const sessionMap = new Map((sessions ?? []).map((s) => [s.id, s.agent_name]));

    // Agrega fraquezas por agente
    const stats: Record<string, Record<string, { sum: number; count: number }>> = {};
    for (const a of analyses ?? []) {
      const agent = sessionMap.get(a.call_session_id as string);
      if (!agent) continue;
      stats[agent] ??= {};
      const metrics = {
        empathy: a.empathy_score,
        clarity: a.clarity_score,
        objection_handling: a.objection_handling_score,
        compliance: a.compliance_score,
      };
      for (const [k, v] of Object.entries(metrics)) {
        if (typeof v !== 'number') continue;
        stats[agent][k] ??= { sum: 0, count: 0 };
        stats[agent][k].sum += v;
        stats[agent][k].count += 1;
      }
    }

    const weaknesses: AgentWeakness[] = [];
    for (const [agent, mets] of Object.entries(stats)) {
      for (const [k, v] of Object.entries(mets)) {
        const avg = v.sum / Math.max(1, v.count);
        if (avg < 60 && v.count >= 3) {
          weaknesses.push({
            agent_name: agent,
            weakness: k as AgentWeakness['weakness'],
            score: Number(avg.toFixed(2)),
            sample_count: v.count,
          });
        }
      }
    }

    // Rate-limit: 1 trilha ativa/semana/agente
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from('coaching_assignments')
      .select('agent_id, created_at')
      .gte('created_at', weekAgo);

    const recentAgentIds = new Set((recent ?? []).map((r) => r.agent_id));

    // Busca agents + módulos
    const { data: agents } = await admin.from('agents').select('id, name');
    const agentByName = new Map((agents ?? []).map((a) => [a.name, a.id]));

    const { data: modules } = await admin
      .from('learning_modules')
      .select('id, title, tags')
      .eq('is_active', true);

    let created = 0;
    for (const w of weaknesses) {
      const aid = agentByName.get(w.agent_name);
      if (!aid || recentAgentIds.has(aid)) continue;

      // Encontra módulo cujas tags casam com a fraqueza
      const match = (modules ?? []).find((m) =>
        (m.tags ?? []).some((t: string) => t.toLowerCase().includes(w.weakness.replace('_', ' ')))
      );

      const payload = {
        agent_id: aid,
        module_id: match?.id ?? null,
        priority: w.score < 40 ? 'high' : 'medium',
        reason: `Trilha automática — ${w.weakness} médio ${w.score} em ${w.sample_count} chamadas (14d)`,
        status: 'pending',
        assigned_by: user.id,
      };

      const { error: insErr } = await admin.from('coaching_assignments').insert(payload);
      if (!insErr) {
        created += 1;
        recentAgentIds.add(aid);

        // Notifica agente
        const { data: profile } = await admin
          .from('user_profiles')
          .select('id')
          .eq('agent_id', aid)
          .maybeSingle();
        if (profile) {
          await admin.from('notifications').insert({
            user_id: profile.id,
            title: 'Nova trilha de coaching',
            message: `Sugestão automática: ${w.weakness.replace('_', ' ')}. Confira em /coaching.`,
            type: 'info',
            category: 'coaching',
            severity: 'info',
            action_url: '/coaching',
            action_label: 'Ver trilha',
            source_type: 'auto_coaching',
            source_id: aid,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ analyzed: (analyses ?? []).length, weaknesses: weaknesses.length, assignments_created: created }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
