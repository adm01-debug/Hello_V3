import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default thresholds
const DEFAULT_THRESHOLDS = {
  avgWaitTimeWarning: 45,      // seconds
  avgWaitTimeCritical: 90,     // seconds
  abandonmentRateWarning: 10,  // percent
  abandonmentRateCritical: 20, // percent
  serviceLevelWarning: 80,     // percent (below this triggers warning)
  serviceLevelCritical: 60,    // percent (below this triggers critical)
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting queue metrics check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch completed calls in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: completedCalls, error: completedError } = await supabaseAdmin
      .from('call_sessions')
      .select('duration_seconds, hold_time_seconds, created_at')
      .eq('status', 'completed')
      .gte('created_at', oneHourAgo.toISOString());

    if (completedError) {
      console.error('Error fetching completed calls:', completedError);
      throw completedError;
    }

    // Fetch abandoned calls in the last hour
    const { data: abandonedCalls, error: abandonedError } = await supabaseAdmin
      .from('call_sessions')
      .select('*')
      .in('status', ['abandoned', 'missed'])
      .gte('created_at', oneHourAgo.toISOString());

    if (abandonedError) {
      console.error('Error fetching abandoned calls:', abandonedError);
      throw abandonedError;
    }

    const completed = completedCalls || [];
    const abandoned = abandonedCalls || [];
    const total = completed.length + abandoned.length;

    console.log(`Completed calls in last hour: ${completed.length}`);
    console.log(`Abandoned calls in last hour: ${abandoned.length}`);

    // Calculate metrics
    const totalHoldTime = completed.reduce((sum, call) => sum + (call.hold_time_seconds || 0), 0);
    const avgWaitTime = completed.length > 0 ? Math.round(totalHoldTime / completed.length) : 0;
    const abandonmentRate = total > 0 ? Math.round((abandoned.length / total) * 100) : 0;
    const answeredQuickly = completed.filter(call => (call.hold_time_seconds || 0) <= 30).length;
    const serviceLevelPercent = completed.length > 0 ? Math.round((answeredQuickly / completed.length) * 100) : 100;

    console.log(`Metrics - AvgWait: ${avgWaitTime}s, Abandonment: ${abandonmentRate}%, ServiceLevel: ${serviceLevelPercent}%`);

    // Check if we need to create alerts
    const alerts: any[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    // Create a dummy call session ID for queue-level alerts
    // First, get any recent call to link the alert to
    const { data: recentCall } = await supabaseAdmin
      .from('call_sessions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recentCall) {
      console.log('No calls found to attach alerts to');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No calls to analyze',
        metrics: { avgWaitTime, abandonmentRate, serviceLevelPercent }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing alerts in the last 30 minutes to avoid duplicates
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const { data: existingAlerts } = await supabaseAdmin
      .from('call_alerts')
      .select('alert_type, severity, created_at')
      .gte('created_at', thirtyMinutesAgo.toISOString())
      .in('alert_type', ['avg_wait_time_exceeded', 'abandonment_rate_exceeded', 'service_level_low']);

    const hasRecentAlert = (type: string, severity: string) => {
      return existingAlerts?.some(a => a.alert_type === type && a.severity === severity);
    };

    // Average wait time alerts
    if (avgWaitTime >= DEFAULT_THRESHOLDS.avgWaitTimeCritical && !hasRecentAlert('avg_wait_time_exceeded', 'critical')) {
      alerts.push({
        call_session_id: recentCall.id,
        alert_type: 'avg_wait_time_exceeded',
        severity: 'critical',
        title: 'Tempo de Espera Médio Crítico',
        message: `O tempo médio de espera na última hora é de ${avgWaitTime}s (limite: ${DEFAULT_THRESHOLDS.avgWaitTimeCritical}s). Considere adicionar mais agentes.`
      });
    } else if (avgWaitTime >= DEFAULT_THRESHOLDS.avgWaitTimeWarning && !hasRecentAlert('avg_wait_time_exceeded', 'warning')) {
      alerts.push({
        call_session_id: recentCall.id,
        alert_type: 'avg_wait_time_exceeded',
        severity: 'warning',
        title: 'Tempo de Espera Médio Elevado',
        message: `O tempo médio de espera na última hora é de ${avgWaitTime}s (limite: ${DEFAULT_THRESHOLDS.avgWaitTimeWarning}s).`
      });
    }

    // Abandonment rate alerts
    if (abandonmentRate >= DEFAULT_THRESHOLDS.abandonmentRateCritical && !hasRecentAlert('abandonment_rate_exceeded', 'critical')) {
      alerts.push({
        call_session_id: recentCall.id,
        alert_type: 'abandonment_rate_exceeded',
        severity: 'critical',
        title: 'Taxa de Abandono Crítica',
        message: `Taxa de abandono na última hora: ${abandonmentRate}% (${abandoned.length} de ${total} chamadas). Ação imediata necessária.`
      });
    } else if (abandonmentRate >= DEFAULT_THRESHOLDS.abandonmentRateWarning && !hasRecentAlert('abandonment_rate_exceeded', 'warning')) {
      alerts.push({
        call_session_id: recentCall.id,
        alert_type: 'abandonment_rate_exceeded',
        severity: 'warning',
        title: 'Taxa de Abandono Elevada',
        message: `Taxa de abandono na última hora: ${abandonmentRate}% (${abandoned.length} de ${total} chamadas).`
      });
    }

    // Service level alerts (inverted - low is bad)
    if (serviceLevelPercent <= DEFAULT_THRESHOLDS.serviceLevelCritical && !hasRecentAlert('service_level_low', 'critical')) {
      alerts.push({
        call_session_id: recentCall.id,
        alert_type: 'service_level_low',
        severity: 'critical',
        title: 'Nível de Serviço Crítico',
        message: `Apenas ${serviceLevelPercent}% das chamadas foram atendidas em até 30s (meta: ${DEFAULT_THRESHOLDS.serviceLevelWarning}%).`
      });
    } else if (serviceLevelPercent <= DEFAULT_THRESHOLDS.serviceLevelWarning && !hasRecentAlert('service_level_low', 'warning')) {
      alerts.push({
        call_session_id: recentCall.id,
        alert_type: 'service_level_low',
        severity: 'warning',
        title: 'Nível de Serviço Baixo',
        message: `Nível de serviço na última hora: ${serviceLevelPercent}% (meta: ${DEFAULT_THRESHOLDS.serviceLevelWarning}%).`
      });
    }

    // Insert alerts
    if (alerts.length > 0) {
      console.log(`Creating ${alerts.length} queue metric alerts`);
      const { error: insertError } = await supabaseAdmin.from('call_alerts').insert(alerts);
      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }
    }

    console.log('Queue metrics check completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      metrics: {
        avgWaitTime,
        abandonmentRate,
        serviceLevelPercent,
        totalCalls: total,
        completedCalls: completed.length,
        abandonedCalls: abandoned.length
      },
      alertsCreated: alerts.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-queue-metrics:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: errorMessage }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
