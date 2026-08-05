// Edge Function: voip-diagnostic-voice-qa (Onda 20)
// Q&A conversacional sobre o estado VoIP. Agrega contexto recente
// (recomendações, alertas críticos, ações aplicadas, MOS médio) e
// pergunta ao Lovable AI Gateway com system prompt PT-BR.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, string, oneOf, optional } from '../_shared/validate.ts';

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';

interface Citation {
  type: 'recommendation' | 'alert' | 'metric' | 'action';
  label: string;
  ref?: string;
}

export interface VoiceQAResponse {
  answer: string;
  citations: Citation[];
  confidence: 'high' | 'medium' | 'low';
  contextSize: number;
  requestId: string;
}

const SYSTEM_PROMPT = `Você é um especialista sênior em telefonia VoIP, redes e qualidade de chamadas (MOS, jitter, packet loss, RTT). Responda SEMPRE em português brasileiro, de forma direta, técnica mas acessível, em até 6 frases. Use o contexto fornecido entre <contexto>...</contexto> como única fonte de verdade. Se o contexto não cobrir a pergunta, diga claramente "Não há dados suficientes para responder com precisão" e sugira qual diagnóstico rodar. Nunca invente números. Quando citar métricas, mencione o nome (ex.: "MOS 3.4", "12 alertas críticos"). Termine com uma única recomendação acionável quando fizer sentido.`;

function buildContextBlock(ctx: {
  mosAvg: number | null;
  totalCalls: number;
  unackAlerts: number;
  criticalAlerts: number;
  appliedActions: number;
  topCategories: Array<{ category: string; count: number }>;
  worstAgents: Array<{ name: string; mos: number }>;
}): string {
  const lines: string[] = [];
  lines.push(`MOS médio: ${ctx.mosAvg !== null ? ctx.mosAvg.toFixed(2) : 'sem dados'} (${ctx.totalCalls} chamadas analisadas)`);
  lines.push(`Alertas: ${ctx.unackAlerts} não-reconhecidos, ${ctx.criticalAlerts} críticos`);
  lines.push(`Ações aplicadas no período: ${ctx.appliedActions}`);
  if (ctx.topCategories.length) {
    lines.push(`Categorias com mais ocorrências: ${ctx.topCategories.map(c => `${c.category} (${c.count})`).join(', ')}`);
  }
  if (ctx.worstAgents.length) {
    lines.push(`Agentes com pior MOS: ${ctx.worstAgents.map(a => `${a.name}=${a.mos.toFixed(2)}`).join(', ')}`);
  }
  return lines.join('\n');
}

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
      question: string({ min: 5, max: 500 }),
      period: optional(oneOf('day', 'week', 'month')),
    });
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: 'Invalid params', details: validation.errors, requestId }), { status: 400, headers });
    }

    const period = (validation.data.period ?? 'week') as 'day' | 'week' | 'month';
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const [qualityRes, alertsRes, actionsRes] = await Promise.all([
      supabase.from('call_quality_metrics')
        .select('agent_name, mos_avg, created_at')
        .gte('created_at', since).limit(500),
      supabase.from('voip_quality_alerts')
        .select('alert_type, acknowledged_at, created_at')
        .gte('created_at', since).limit(200),
      supabase.from('voip_recommendation_actions')
        .select('category, outcome, applied_at')
        .gte('applied_at', since).limit(200),
    ]);

    const quality = (qualityRes.data ?? []) as Array<{ agent_name: string | null; mos_avg: number | null; created_at: string }>;
    const alerts = (alertsRes.data ?? []) as Array<{ alert_type: string; acknowledged_at: string | null }>;
    const actions = (actionsRes.data ?? []) as Array<{ category: string; outcome: string }>;

    const mosVals = quality.map(q => q.mos_avg).filter((v): v is number => v !== null);
    const mosAvg = mosVals.length ? Number((mosVals.reduce((s, v) => s + v, 0) / mosVals.length).toFixed(2)) : null;

    const unackAlerts = alerts.filter(a => !a.acknowledged_at).length;
    const criticalAlerts = alerts.filter(a => a.alert_type === 'poor' || a.alert_type === 'offline').length;
    const appliedActions = actions.filter(a => a.outcome === 'applied' || a.outcome === 'auto_applied').length;

    // Top categorias
    const catMap = new Map<string, number>();
    for (const a of actions) catMap.set(a.category, (catMap.get(a.category) ?? 0) + 1);
    const topCategories = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    // Piores agentes (≥3 amostras)
    const agentMap = new Map<string, number[]>();
    for (const q of quality) {
      if (!q.agent_name || q.mos_avg === null) continue;
      if (!agentMap.has(q.agent_name)) agentMap.set(q.agent_name, []);
      agentMap.get(q.agent_name)!.push(q.mos_avg);
    }
    const worstAgents = Array.from(agentMap.entries())
      .filter(([, v]) => v.length >= 3)
      .map(([name, v]) => ({ name, mos: v.reduce((s, n) => s + n, 0) / v.length }))
      .sort((a, b) => a.mos - b.mos).slice(0, 3);

    const contextBlock = buildContextBlock({
      mosAvg, totalCalls: quality.length, unackAlerts, criticalAlerts,
      appliedActions, topCategories, worstAgents,
    });

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI gateway não configurado', requestId }), { status: 500, headers });
    }

    const aiRes = await fetch(AI_GATEWAY, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `<contexto>\nPeríodo: ${period} (desde ${since})\n${contextBlock}\n</contexto>\n\nPergunta: ${validation.data.question}` },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em instantes.', requestId }), { status: 429, headers });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos no workspace.', requestId }), { status: 402, headers });
    }
    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'Falha no AI Gateway', detail: text.slice(0, 200), requestId }), { status: 502, headers });
    }

    const aiJson = await aiRes.json();
    const answer: string = aiJson?.choices?.[0]?.message?.content ?? 'Não foi possível gerar resposta.';

    const citations: Citation[] = [];
    if (mosAvg !== null) citations.push({ type: 'metric', label: `MOS médio ${mosAvg}`, ref: '#quality-heatmap' });
    if (criticalAlerts > 0) citations.push({ type: 'alert', label: `${criticalAlerts} alertas críticos`, ref: '#quality-alerts' });
    if (appliedActions > 0) citations.push({ type: 'action', label: `${appliedActions} ações aplicadas` });
    for (const a of worstAgents) citations.push({ type: 'recommendation', label: `${a.name}: MOS ${a.mos.toFixed(2)}`, ref: '#agent-ranking' });

    const confidence: VoiceQAResponse['confidence'] =
      quality.length > 50 ? 'high' : quality.length > 10 ? 'medium' : 'low';

    const response: VoiceQAResponse = {
      answer,
      citations,
      confidence,
      contextSize: quality.length + alerts.length + actions.length,
      requestId,
    };

    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, requestId }), { status: 500, headers });
  }
});
