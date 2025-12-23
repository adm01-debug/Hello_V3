import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HoldAlertConfig {
  warningThresholdSeconds: number;
  criticalThresholdSeconds: number;
}

const DEFAULT_CONFIG: HoldAlertConfig = {
  warningThresholdSeconds: 60,  // 1 minute
  criticalThresholdSeconds: 180, // 3 minutes
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional config from request body
    let config = DEFAULT_CONFIG;
    try {
      const body = await req.json();
      if (body.warningThresholdSeconds) {
        config.warningThresholdSeconds = body.warningThresholdSeconds;
      }
      if (body.criticalThresholdSeconds) {
        config.criticalThresholdSeconds = body.criticalThresholdSeconds;
      }
    } catch {
      // Use defaults if no body provided
    }

    console.log('Checking hold alerts with config:', config);

    // Get active hold events (calls currently on hold)
    const { data: activeHolds, error: holdsError } = await supabase
      .from('hold_events')
      .select(`
        id,
        call_session_id,
        started_at,
        agent_name,
        call_sessions (
          caller_name,
          caller_phone
        )
      `)
      .is('ended_at', null);

    if (holdsError) {
      console.error('Error fetching hold events:', holdsError);
      throw holdsError;
    }

    console.log(`Found ${activeHolds?.length || 0} active hold events`);

    const alerts: Array<{
      call_session_id: string;
      alert_type: string;
      severity: string;
      title: string;
      message: string;
    }> = [];

    const now = new Date();

    for (const hold of activeHolds || []) {
      const holdStartTime = new Date(hold.started_at);
      const holdDurationSeconds = Math.floor((now.getTime() - holdStartTime.getTime()) / 1000);
      
      const callSession = hold.call_sessions as { caller_name?: string; caller_phone?: string } | null;
      const callerIdentifier = callSession?.caller_name || callSession?.caller_phone || 'Cliente';

      // Check if we already have an alert for this hold event
      const { data: existingAlerts } = await supabase
        .from('call_alerts')
        .select('id, severity')
        .eq('call_session_id', hold.call_session_id)
        .eq('alert_type', 'hold_time_exceeded')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastAlertSeverity = existingAlerts?.[0]?.severity;

      // Determine alert severity based on hold duration
      let severity: 'warning' | 'critical' | null = null;

      if (holdDurationSeconds >= config.criticalThresholdSeconds) {
        // Only create critical alert if we haven't already
        if (lastAlertSeverity !== 'critical') {
          severity = 'critical';
        }
      } else if (holdDurationSeconds >= config.warningThresholdSeconds) {
        // Only create warning alert if we haven't created any alert yet
        if (!lastAlertSeverity) {
          severity = 'warning';
        }
      }

      if (severity) {
        const minutes = Math.floor(holdDurationSeconds / 60);
        const seconds = holdDurationSeconds % 60;
        const durationText = minutes > 0 
          ? `${minutes}min ${seconds}s` 
          : `${seconds}s`;

        alerts.push({
          call_session_id: hold.call_session_id,
          alert_type: 'hold_time_exceeded',
          severity,
          title: severity === 'critical' 
            ? '🚨 Tempo de Espera Crítico' 
            : '⚠️ Tempo de Espera Elevado',
          message: severity === 'critical'
            ? `${callerIdentifier} está em espera há ${durationText} (limite crítico: ${Math.floor(config.criticalThresholdSeconds / 60)}min). Agente: ${hold.agent_name || 'Não identificado'}. Ação imediata necessária!`
            : `${callerIdentifier} está em espera há ${durationText} (limite: ${Math.floor(config.warningThresholdSeconds / 60)}min). Agente: ${hold.agent_name || 'Não identificado'}. Considere retomar a chamada.`
        });

        console.log(`Creating ${severity} alert for hold event ${hold.id}, duration: ${durationText}`);
      }
    }

    // Insert alerts if any
    if (alerts.length > 0) {
      const { error: insertError } = await supabase.from('call_alerts').insert(alerts);
      if (insertError) {
        console.error('Error inserting hold alerts:', insertError);
        throw insertError;
      }
      console.log(`Created ${alerts.length} hold alerts`);
    }

    // Also check completed hold events with excessive duration
    const { data: recentCompletedHolds, error: completedError } = await supabase
      .from('hold_events')
      .select(`
        id,
        call_session_id,
        duration_seconds,
        agent_name,
        ended_at,
        call_sessions (
          caller_name,
          caller_phone
        )
      `)
      .not('ended_at', 'is', null)
      .gte('ended_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .gte('duration_seconds', config.warningThresholdSeconds);

    if (completedError) {
      console.error('Error fetching completed holds:', completedError);
    } else {
      console.log(`Found ${recentCompletedHolds?.length || 0} recently completed long holds`);

      for (const hold of recentCompletedHolds || []) {
        // Check if we already have an alert for this specific completed hold
        const { data: existingAlerts } = await supabase
          .from('call_alerts')
          .select('id')
          .eq('call_session_id', hold.call_session_id)
          .eq('alert_type', 'hold_completed_long')
          .limit(1);

        if (!existingAlerts?.length && hold.duration_seconds) {
          const callSession = hold.call_sessions as { caller_name?: string; caller_phone?: string } | null;
          const callerIdentifier = callSession?.caller_name || callSession?.caller_phone || 'Cliente';
          const minutes = Math.floor(hold.duration_seconds / 60);
          const seconds = hold.duration_seconds % 60;
          const durationText = minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;

          const severity = hold.duration_seconds >= config.criticalThresholdSeconds ? 'critical' : 'warning';

          const { error: insertError } = await supabase.from('call_alerts').insert({
            call_session_id: hold.call_session_id,
            alert_type: 'hold_completed_long',
            severity,
            title: severity === 'critical' 
              ? '📊 Hold Crítico Finalizado' 
              : '📊 Hold Longo Finalizado',
            message: `${callerIdentifier} ficou em espera por ${durationText}. Agente: ${hold.agent_name || 'Não identificado'}. Revise o atendimento para melhorias.`
          });

          if (insertError) {
            console.error('Error inserting completed hold alert:', insertError);
          } else {
            console.log(`Created completed hold alert for session ${hold.call_session_id}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        activeHoldsChecked: activeHolds?.length || 0,
        alertsCreated: alerts.length,
        config 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in check-hold-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
