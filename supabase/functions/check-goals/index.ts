import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardGoal {
  id: string;
  name: string;
  metric_type: string;
  target_value: number;
  warning_threshold: number;
  critical_threshold: number;
  comparison_operator: string;
  is_active: boolean;
  notify_on_warning: boolean;
  notify_on_critical: boolean;
}

interface Metrics {
  serviceLevel: number;
  abandonmentRate: number;
  avgWaitTime: number;
  avgHandleTime: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting goals check...');

    // Fetch active goals
    const { data: goals, error: goalsError } = await supabase
      .from('dashboard_goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      throw goalsError;
    }

    if (!goals || goals.length === 0) {
      console.log('No active goals found');
      return new Response(
        JSON.stringify({ message: 'No active goals to check', alertsCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${goals.length} active goals`);

    // Calculate current metrics
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Fetch completed calls
    const { data: completedCalls, error: completedError } = await supabase
      .from('call_sessions')
      .select('duration_seconds, hold_time_seconds, status')
      .eq('status', 'completed')
      .gte('created_at', oneHourAgo);

    if (completedError) {
      console.error('Error fetching completed calls:', completedError);
      throw completedError;
    }

    // Fetch abandoned calls
    const { data: abandonedCalls, error: abandonedError } = await supabase
      .from('call_sessions')
      .select('*')
      .in('status', ['abandoned', 'missed'])
      .gte('created_at', oneHourAgo);

    if (abandonedError) {
      console.error('Error fetching abandoned calls:', abandonedError);
      throw abandonedError;
    }

    const completed = completedCalls || [];
    const abandoned = abandonedCalls || [];
    const total = completed.length + abandoned.length;

    // Calculate metrics
    const avgHandleTime = completed.length > 0
      ? completed.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / completed.length
      : 0;

    const avgWaitTime = completed.length > 0
      ? completed.reduce((sum, c) => sum + (c.hold_time_seconds || 0), 0) / completed.length
      : 0;

    const abandonmentRate = total > 0 ? (abandoned.length / total) * 100 : 0;

    // Service level (calls answered within 20 seconds)
    const answeredQuickly = completed.filter(c => (c.hold_time_seconds || 0) < 20).length;
    const serviceLevel = completed.length > 0
      ? (answeredQuickly / completed.length) * 100
      : 100;

    const metrics: Metrics = {
      serviceLevel: Math.round(serviceLevel),
      abandonmentRate: Math.round(abandonmentRate * 10) / 10,
      avgWaitTime: Math.round(avgWaitTime),
      avgHandleTime: Math.round(avgHandleTime),
    };

    console.log('Current metrics:', metrics);

    // Check each goal and create alerts
    let alertsCreated = 0;
    const now = new Date().toISOString();

    for (const goal of goals as DashboardGoal[]) {
      let currentValue = 0;
      
      switch (goal.metric_type) {
        case 'service_level':
          currentValue = metrics.serviceLevel;
          break;
        case 'abandonment_rate':
          currentValue = metrics.abandonmentRate;
          break;
        case 'avg_wait_time':
          currentValue = metrics.avgWaitTime;
          break;
        case 'avg_handle_time':
          currentValue = metrics.avgHandleTime;
          break;
      }

      let status: 'ok' | 'warning' | 'critical' = 'ok';

      if (goal.comparison_operator === 'gte') {
        // Greater than or equal (e.g., service level should be >= 80%)
        if (currentValue < goal.critical_threshold) {
          status = 'critical';
        } else if (currentValue < goal.warning_threshold) {
          status = 'warning';
        }
      } else {
        // Less than or equal (e.g., abandonment rate should be <= 5%)
        if (currentValue > goal.critical_threshold) {
          status = 'critical';
        } else if (currentValue > goal.warning_threshold) {
          status = 'warning';
        }
      }

      console.log(`Goal "${goal.name}": current=${currentValue}, status=${status}`);

      // Create alert if needed
      if (status !== 'ok') {
        const shouldNotify = 
          (status === 'warning' && goal.notify_on_warning) ||
          (status === 'critical' && goal.notify_on_critical);

        if (shouldNotify) {
          // Check if there's already a recent alert for this goal (within last 15 minutes)
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
          
          const { data: existingAlerts } = await supabase
            .from('call_alerts')
            .select('id')
            .eq('alert_type', `goal_${goal.metric_type}`)
            .gte('created_at', fifteenMinutesAgo)
            .limit(1);

          if (!existingAlerts || existingAlerts.length === 0) {
            // Create a dummy call session for the alert (since call_session_id is required)
            // First, try to get an active call session, or use the most recent one
            const { data: sessions } = await supabase
              .from('call_sessions')
              .select('id')
              .order('created_at', { ascending: false })
              .limit(1);

            let sessionId = sessions?.[0]?.id;

            // If no session exists, create a system session for goal alerts
            if (!sessionId) {
              const { data: newSession, error: sessionError } = await supabase
                .from('call_sessions')
                .insert({
                  status: 'system',
                  caller_name: 'Sistema',
                  agent_name: 'Monitor de Metas',
                })
                .select('id')
                .single();

              if (sessionError) {
                console.error('Error creating system session:', sessionError);
                continue;
              }
              sessionId = newSession.id;
            }

            const formatValue = (value: number, type: string) => {
              if (type === 'avg_wait_time' || type === 'avg_handle_time') {
                const mins = Math.floor(value / 60);
                const secs = value % 60;
                return `${mins}m ${secs}s`;
              }
              return `${value}%`;
            };

            const alertData = {
              call_session_id: sessionId,
              title: `Meta ${status === 'critical' ? 'Crítica' : 'em Aviso'}: ${goal.name}`,
              message: `${goal.name} está em ${formatValue(currentValue, goal.metric_type)} (Meta: ${formatValue(goal.target_value, goal.metric_type)})`,
              severity: status,
              alert_type: `goal_${goal.metric_type}`,
              is_read: false,
            };

            const { error: insertError } = await supabase
              .from('call_alerts')
              .insert(alertData);

            if (insertError) {
              console.error('Error creating alert:', insertError);
            } else {
              console.log(`Alert created for goal "${goal.name}"`);
              alertsCreated++;
            }
          } else {
            console.log(`Skipping alert for "${goal.name}" - recent alert already exists`);
          }
        }
      }
    }

    console.log(`Goals check completed. Alerts created: ${alertsCreated}`);

    return new Response(
      JSON.stringify({ 
        message: 'Goals check completed',
        metrics,
        goalsChecked: goals.length,
        alertsCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-goals function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
