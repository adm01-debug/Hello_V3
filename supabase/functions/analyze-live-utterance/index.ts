import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, optional, number } from "../_shared/validate.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

interface AssistSignal {
  intent: string;
  confidence: number;
  suggestion: string;
  trigger_text: string;
  speaker: string;
  source: string;
  metadata?: Record<string, unknown>;
}

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

    const rl = await checkRateLimitDB(getClientIp(req), 'analyze-live-utterance', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = validate(body, {
      callSessionId: string({ min: 1, max: 64 }),
      latestUtterance: string({ min: 1, max: 3000 }),
      recentContext: optional(string({ max: 8000 })),
      speaker: optional(string({ max: 20 })),
      agentName: optional(string({ max: 120 })),
      timestampSeconds: optional(number()),
    });

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Dados inválidos', details: parsed.errors }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const callSessionId = parsed.data.callSessionId as string;
    const latestUtterance = parsed.data.latestUtterance as string;
    const recentContext = (parsed.data.recentContext as string) || '';
    const speaker = (parsed.data.speaker as string) || 'customer';
    const agentName = (parsed.data.agentName as string) || null;
    const timestampSeconds = Math.floor(Number(parsed.data.timestampSeconds ?? 0));

    // Carrega regras de compliance e biblioteca de objeções (via service role para garantir acesso)
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const [{ data: complianceRules }, { data: objections }] = await Promise.all([
      adminClient.from('compliance_rules').select('id, rule_name, pattern, severity, message, applies_to')
        .eq('is_active', true).limit(50),
      adminClient.from('objection_library').select('id, objection_type, trigger_keywords, recommended_response, talking_points')
        .eq('is_active', true).limit(30),
    ]);

    const signals: AssistSignal[] = [];

    // 1) Compliance — pattern matching local rápido
    const lowerText = latestUtterance.toLowerCase();
    for (const rule of (complianceRules ?? [])) {
      if (rule.applies_to !== 'both' && rule.applies_to !== speaker) continue;
      try {
        const re = new RegExp(rule.pattern, 'i');
        if (re.test(latestUtterance)) {
          signals.push({
            intent: 'compliance_violation',
            confidence: 0.95,
            suggestion: rule.message,
            trigger_text: latestUtterance.slice(0, 200),
            speaker,
            source: 'compliance',
            metadata: { rule_id: rule.id, rule_name: rule.rule_name, severity: rule.severity },
          });
        }
      } catch {
        // regex inválida: ignora silenciosamente
      }
    }

    // 2) Objeções — keyword matching local
    if (speaker === 'customer') {
      for (const obj of (objections ?? [])) {
        const hit = (obj.trigger_keywords ?? []).some((kw: string) =>
          kw && lowerText.includes(kw.toLowerCase())
        );
        if (hit) {
          signals.push({
            intent: 'objection',
            confidence: 0.85,
            suggestion: obj.recommended_response,
            trigger_text: latestUtterance.slice(0, 200),
            speaker,
            source: 'objection_library',
            metadata: {
              objection_id: obj.id,
              objection_type: obj.objection_type,
              talking_points: obj.talking_points,
            },
          });
          break; // uma objeção por análise para não poluir
        }
      }
    }

    // 3) IA — intent detection contextual
    const systemPrompt = `Você é um copiloto em tempo real para agentes de call center brasileiros.
Analise a última fala e detecte se há um dos intents abaixo. Responda APENAS JSON válido.

Intents possíveis: technical_question, discount_request, buying_signal, churn_risk, sentiment_alert, none

{
  "intent": "...",
  "confidence": 0.0-1.0,
  "suggestion": "ação recomendada curta em PT-BR (máx 40 palavras)",
  "reasoning": "1 frase"
}

Retorne intent="none" se nada relevante for detectado.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Contexto recente:\n${recentContext.slice(-1500)}\n\nÚltima fala (${speaker}):\n"${latestUtterance.slice(0, 800)}"` },
        ],
      }),
    });

    if (aiResp.ok) {
      const aiJson = await aiResp.json();
      const content = aiJson.choices?.[0]?.message?.content || '';
      try {
        const m = content.match(/\{[\s\S]*\}/);
        const ai = m ? JSON.parse(m[0]) : null;
        if (ai && ai.intent && ai.intent !== 'none') {
          signals.push({
            intent: ai.intent,
            confidence: Math.min(1, Math.max(0, Number(ai.confidence) || 0.7)),
            suggestion: String(ai.suggestion || '').slice(0, 500),
            trigger_text: latestUtterance.slice(0, 200),
            speaker,
            source: 'live_analysis',
            metadata: { reasoning: ai.reasoning },
          });
        }
      } catch {
        // parse falhou: segue sem o sinal de IA
      }
    }

    // Persistir os sinais (best-effort)
    if (signals.length > 0) {
      const rows = signals.map((s) => ({
        call_session_id: callSessionId,
        agent_name: agentName,
        intent: s.intent,
        confidence: s.confidence,
        suggestion: s.suggestion,
        trigger_text: s.trigger_text,
        speaker: s.speaker,
        source: s.source,
        metadata: s.metadata ?? {},
        timestamp_seconds: timestampSeconds,
      }));
      await adminClient.from('live_assist_signals').insert(rows);

      // Incrementa contador de sugestões para objeções
      const objIds = signals
        .filter((s) => s.source === 'objection_library' && s.metadata?.objection_id)
        .map((s) => s.metadata!.objection_id as string);
      if (objIds.length > 0) {
        for (const oid of objIds) {
          await adminClient.rpc('check_rate_limit', { _ip_address: 'noop', _endpoint: 'noop' }).catch(() => {});
          await adminClient.from('objection_library')
            .update({ times_suggested: (signals.length) }) // best-effort; uso real conta no front
            .eq('id', oid);
        }
      }
    }

    return new Response(JSON.stringify({ signals }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro interno', message: String(e) }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
