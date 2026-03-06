import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settingsData } = await supabaseAdmin
      .from('hold_alert_settings').select('*').limit(1).maybeSingle();

    const config = {
      warningThresholdSeconds: settingsData?.warning_threshold_seconds || 60,
      criticalThresholdSeconds: settingsData?.critical_threshold_seconds || 180,
    };

    if (settingsData && !settingsData.enabled) {
      return new Response(JSON.stringify({ success: true, message: 'Alertas desabilitados' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: activeHolds } = await supabaseAdmin
      .from('hold_events')
      .select('id, call_session_id, started_at, agent_name, call_sessions(caller_name)')
      .is('ended_at', null);

    const alerts: any[] = [];
    const now = new Date();

    for (const hold of activeHolds || []) {
      const holdDurationSeconds = Math.floor((now.getTime() - new Date(hold.started_at).getTime()) / 1000);
      const { data: existingAlerts } = await supabaseAdmin
        .from('call_alerts').select('severity').eq('call_session_id', hold.call_session_id)
        .eq('alert_type', 'hold_time_exceeded').order('created_at', { ascending: false }).limit(1);

      const lastSeverity = existingAlerts?.[0]?.severity;
      let severity: string | null = null;

      if (holdDurationSeconds >= config.criticalThresholdSeconds && lastSeverity !== 'critical') {
        severity = 'critical';
      } else if (holdDurationSeconds >= config.warningThresholdSeconds && !lastSeverity) {
        severity = 'warning';
      }

      if (severity) {
        alerts.push({
          call_session_id: hold.call_session_id, alert_type: 'hold_time_exceeded', severity,
          title: severity === 'critical' ? 'Tempo de Espera Crítico' : 'Tempo de Espera Elevado',
          message: `Cliente em espera há ${Math.floor(holdDurationSeconds / 60)}min. Agente: ${hold.agent_name || 'N/A'}`
        });
      }
    }

    if (alerts.length > 0) {
      await supabaseAdmin.from('call_alerts').insert(alerts);
    }

    return new Response(JSON.stringify({ success: true, activeHoldsChecked: activeHolds?.length || 0, alertsCreated: alerts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
