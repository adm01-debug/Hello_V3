// Edge Function: voip-executive-narrative (Onda 20)
// Gera resumo executivo narrativo PT-BR (≤400 palavras) sobre o estado VoIP.
// Agrega KPIs, top recomendações e padrões; usa Lovable AI para a narrativa.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, oneOf, optional } from '../_shared/validate.ts';

const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30 };
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';

export interface ExecKpis {
  mosAvg: number | null;
  totalCalls: number;
  totalAlerts: number;
  criticalAlerts: number;
  appliedActions: number;
  effectivenessPct: number | null;
}

export interface ExecutiveNarrativeResponse {
  summary: string;
  kpis: ExecKpis;
  topApplied: Array<{ category: string; count: number }>;
  pendingHints: string[];
  generatedAt: string;
  period: 'week' | 'month';
  requestId: string;
}

const SYSTEM_PROMPT = `Você é diretor de operações VoIP e produz resumos executivos para liderança não-técnica. Escreva SEMPRE em português brasileiro, em no máximo 400 palavras. Estrutura obrigatória: 1) Visão geral (2-3 frases sobre saúde da operação), 2) Principais sinais positivos, 3) Riscos e pontos de atenção, 4) Próximos passos recomendados (lista 2-4 itens). Use os números fornecidos entre <kpis>...</kpis> exatamente como estão; nunca invente. Tom profissional, claro, acionável.`;

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const headers = { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId };

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', requestId }), { status: 405, headers });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers });
    }

    const body = await req.json().catch(() => ({}));
    const validation = validate(body, {
      period: oneOf('week', 'month'),
      format: optional(oneOf('markdown', 'plain')),
    });
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }), { status: 400, headers });
    }

    const period = validation.data.period as 'week' | 'month';
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const [qualityRes, alertsRes, actionsRes] = await Promise.all([
      supabase.from('call_quality_metrics').select('mos_avg, created_at').gte('created_at', since).limit(2000),
      supabase.from('voip_quality_alerts').select('alert_type, acknowledged_at').gte('created_at', since).limit(500),
      supabase.from('voip_recommendation_actions').select('category, outcome, applied_at').gte('applied_at', since).limit(500),
    ]);

    const quality = (qualityRes.data ?? []) as Array<{ mos_avg: number | null }>;
    const alerts = (alertsRes.data ?? []) as Array<{ alert_type: string; acknowledged_at: string | null }>;
    const actions = (actionsRes.data ?? []) as Array<{ category: string; outcome: string }>;

    const mosVals = quality.map(q => q.mos_avg).filter((v): v is number => v !== null);
    const mosAvg = mosVals.length ? Number((mosVals.reduce((s, v) => s + v, 0) / mosVals.length).toFixed(2)) : null;

    const criticalAlerts = alerts.filter(a => a.alert_type === 'poor' || a.alert_type === 'offline').length;
    const appliedActions = actions.filter(a => a.outcome === 'applied' || a.outcome === 'auto_applied').length;
    const effectivenessPct = actions.length
      ? Number(((appliedActions / actions.length) * 100).toFixed(1))
      : null;

    const catMap = new Map<string, number>();
    for (const a of actions.filter(x => x.outcome === 'applied' || x.outcome === 'auto_applied')) {
      catMap.set(a.category, (catMap.get(a.category) ?? 0) + 1);
    }
    const topApplied = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    const pendingHints: string[] = [];
    const snoozed = actions.filter(a => a.outcome === 'snoozed').length;
    const dismissed = actions.filter(a => a.outcome === 'dismissed').length;
    if (snoozed > 0) pendingHints.push(`${snoozed} recomendações adiadas aguardam revisão`);
    if (dismissed > 5) pendingHints.push(`${dismissed} dispensas — reavaliar relevância das sugestões`);
    if (mosAvg !== null && mosAvg < 3.6) pendingHints.push(`MOS abaixo do alvo (${mosAvg}) — investigar infra`);
    if (criticalAlerts > 10) pendingHints.push(`${criticalAlerts} alertas críticos — priorizar mitigação`);

    const kpis: ExecKpis = {
      mosAvg, totalCalls: quality.length, totalAlerts: alerts.length,
      criticalAlerts, appliedActions, effectivenessPct,
    };

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI gateway não configurado', requestId }), { status: 500, headers });
    }

    const kpiBlock = [
      `Período: ${period === 'week' ? 'última semana' : 'último mês'} (desde ${since})`,
      `MOS médio: ${mosAvg !== null ? mosAvg : 'sem dados'} de 5.0`,
      `Chamadas analisadas: ${quality.length}`,
      `Alertas totais: ${alerts.length} (${criticalAlerts} críticos)`,
      `Ações aplicadas: ${appliedActions} (effectiveness ${effectivenessPct ?? '—'}%)`,
      topApplied.length ? `Top recomendações aplicadas: ${topApplied.map(t => `${t.category} (${t.count})`).join(', ')}` : '',
      pendingHints.length ? `Pontos de atenção: ${pendingHints.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    const aiRes = await fetch(AI_GATEWAY, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `<kpis>\n${kpiBlock}\n</kpis>\n\nGere o resumo executivo agora.` },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'Limite de requisições atingido.', requestId }), { status: 429, headers });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.', requestId }), { status: 402, headers });
    }
    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'Falha no AI Gateway', detail: text.slice(0, 200), requestId }), { status: 502, headers });
    }

    const aiJson = await aiRes.json();
    const summary: string = aiJson?.choices?.[0]?.message?.content ?? 'Não foi possível gerar o resumo.';

    const response: ExecutiveNarrativeResponse = {
      summary, kpis, topApplied, pendingHints,
      generatedAt: new Date().toISOString(),
      period, requestId,
    };

    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
