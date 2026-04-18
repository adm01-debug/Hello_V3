// Edge Function: voip-anomaly-remediation
// Auto-remediação confiável para anomalias VoIP (whitelist rígida + idempotência).
// Mapeia anomalia → ação segura pré-aprovada e registra em voip_recommendation_actions.
// JWT obrigatório, CORS centralizado, dryRun opcional.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validate, string, oneOf, boolean, optional } from '../_shared/validate.ts';

export type AnomalyKind = 'spike' | 'drift' | 'outage';
export type AnomalyMetric = 'mos' | 'jitter' | 'volume';

export interface RemediationPlan {
  action_type: string;
  category: 'codec' | 'campaign' | 'alert' | 'noop';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  destructive: boolean;
}

/** Whitelist rígida — apenas ações não destrutivas. */
const WHITELIST: Record<string, RemediationPlan> = {
  'mos:outage': {
    action_type: 'force_codec_opus_low',
    category: 'codec',
    severity: 'critical',
    description: 'Forçar codec Opus em modo baixa banda para preservar inteligibilidade.',
    destructive: false,
  },
  'mos:drift': {
    action_type: 'notify_supervisor_quality_drift',
    category: 'alert',
    severity: 'warning',
    description: 'Notificar supervisão sobre tendência sustentada de queda de MOS.',
    destructive: false,
  },
  'mos:spike': {
    action_type: 'log_quality_dip',
    category: 'alert',
    severity: 'info',
    description: 'Registrar dip pontual de MOS para análise correlacionada.',
    destructive: false,
  },
  'jitter:outage': {
    action_type: 'pause_outbound_campaigns',
    category: 'campaign',
    severity: 'critical',
    description: 'Pausar campanhas outbound automáticas até jitter normalizar.',
    destructive: false,
  },
  'jitter:drift': {
    action_type: 'throttle_concurrent_calls',
    category: 'campaign',
    severity: 'warning',
    description: 'Reduzir limite de chamadas concorrentes em 30% por 30min.',
    destructive: false,
  },
  'jitter:spike': {
    action_type: 'log_jitter_spike',
    category: 'alert',
    severity: 'info',
    description: 'Registrar spike pontual de jitter para investigação manual.',
    destructive: false,
  },
  'volume:outage': {
    action_type: 'notify_ops_volume_drop',
    category: 'alert',
    severity: 'warning',
    description: 'Notificar operações sobre queda anômala de volume de chamadas.',
    destructive: false,
  },
  'volume:drift': {
    action_type: 'log_volume_anomaly',
    category: 'alert',
    severity: 'info',
    description: 'Registrar desvio de volume sustentado para revisão.',
    destructive: false,
  },
  'volume:spike': {
    action_type: 'log_volume_spike',
    category: 'alert',
    severity: 'info',
    description: 'Registrar pico de volume para correlação com campanhas.',
    destructive: false,
  },
};

const NOOP: RemediationPlan = {
  action_type: 'noop',
  category: 'noop',
  severity: 'info',
  description: 'Anomalia sem ação automática mapeada — revisão manual recomendada.',
  destructive: false,
};

export function planRemediation(metric: AnomalyMetric, kind: AnomalyKind): RemediationPlan {
  const key = `${metric}:${kind}`;
  const plan = WHITELIST[key];
  if (!plan) return NOOP;
  if (plan.destructive) return NOOP; // Fail-safe: nunca executa destrutivo
  return plan;
}

/** Idempotência: chave estável derivada do anomalyId. */
export function idempotencyKey(anomalyId: string): string {
  return `anomaly:${anomalyId}`;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', request_id: requestId }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  }

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', request_id: requestId }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = validate(body, {
      anomalyId: string({ min: 4, max: 128 }),
      metric: oneOf(['mos', 'jitter', 'volume'] as const),
      kind: oneOf(['spike', 'drift', 'outage'] as const),
      dryRun: optional(boolean()),
      notes: optional(string({ max: 500 })),
    });
    if (!parsed.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid params', details: parsed.errors, request_id: requestId }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
        },
      );
    }

    const { anomalyId, metric, kind, dryRun, notes } = parsed.data;
    const plan = planRemediation(metric as AnomalyMetric, kind as AnomalyKind);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', request_id: requestId }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    const idemKey = idempotencyKey(anomalyId);

    // Idempotência: bloqueia re-execução em 1h via lookup em notes contendo a chave
    if (!dryRun) {
      const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
      const { data: existing } = await supabase
        .from('voip_recommendation_actions')
        .select('id, applied_at')
        .eq('user_id', userData.user.id)
        .gte('applied_at', oneHourAgo)
        .like('notes', `%${idemKey}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({
            applied: false,
            reason: 'idempotent_skip',
            existing_action_id: existing[0].id,
            plan,
            request_id: requestId,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
          },
        );
      }
    }

    if (dryRun || plan.action_type === 'noop') {
      return new Response(
        JSON.stringify({ applied: false, dryRun: !!dryRun, plan, request_id: requestId }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
        },
      );
    }

    const composedNotes = `[${idemKey}] auto-remediação | ${plan.description}${
      notes ? ` | ${notes}` : ''
    }`;

    const { data: inserted, error: insertErr } = await supabase
      .from('voip_recommendation_actions')
      .insert({
        user_id: userData.user.id,
        recommendation_id: anomalyId,
        category: plan.category,
        severity: plan.severity,
        action_type: plan.action_type,
        outcome: 'auto_applied',
        notes: composedNotes,
      })
      .select('id, applied_at')
      .single();

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: insertErr.message, request_id: requestId }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
        },
      );
    }

    return new Response(
      JSON.stringify({
        applied: true,
        action_id: inserted.id,
        applied_at: inserted.applied_at,
        plan,
        request_id: requestId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), request_id: requestId }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  }
});
