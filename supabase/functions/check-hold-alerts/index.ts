import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
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
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { data: activeHolds, error: holdsError } = await supabaseAdmin
      .from('hold_events')
      .select('id, call_session_id, started_at, agent_name, call_sessions(caller_name)')
      .is('ended_at', null);

    if (holdsError) throw holdsError;

    const callSessionIds = (activeHolds || []).map(h => h.call_session_id);
    
    // Optimized: Fetch all recent alerts for these sessions in one go
    const { data: existingAlertsData } = callSessionIds.length > 0 
      ? await supabaseAdmin
          .from('call_alerts')
          .select('call_session_id, severity, created_at')
          .in('call_session_id', callSessionIds)
          .eq('alert_type', 'hold_time_exceeded')
          .order('created_at', { ascending: false })
      : { data: [] };

    // Group alerts by session ID to easily find the latest one
    const latestAlertsMap = new Map();
    (existingAlertsData || []).forEach(alert => {
      if (!latestAlertsMap.has(alert.call_session_id)) {
        latestAlertsMap.set(alert.call_session_id, alert.severity);
      }
    });

    const alerts: any[] = [];
    const now = new Date();

    for (const hold of activeHolds || []) {
      const holdDurationSeconds = Math.floor((now.getTime() - new Date(hold.started_at).getTime()) / 1000);
      const lastSeverity = latestAlertsMap.get(hold.call_session_id);
      
      let severity: string | null = null;
      if (holdDurationSeconds >= config.criticalThresholdSeconds && lastSeverity !== 'critical') {
        severity = 'critical';
      } else if (holdDurationSeconds >= config.warningThresholdSeconds && !lastSeverity) {
        severity = 'warning';
      }

      if (severity) {
        alerts.push({
          call_session_id: hold.call_session_id,
          alert_type: 'hold_time_exceeded',
          severity,
          title: severity === 'critical' ? 'Tempo de Espera Crítico' : 'Tempo de Espera Elevado',
          message: `Cliente em espera há ${Math.floor(holdDurationSeconds / 60)}min. Agente: ${hold.agent_name || 'N/A'}`
        });
      }
    }

    if (alerts.length > 0) {
      await supabaseAdmin.from('call_alerts').insert(alerts);
    }

    return new Response(JSON.stringify({ success: true, activeHoldsChecked: activeHolds?.length || 0, alertsCreated: alerts.length }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
