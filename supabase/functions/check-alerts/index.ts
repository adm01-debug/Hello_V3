import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertCheckRequest {
  callSessionId: string;
  sentiment?: string;
  satisfaction?: number;
  urgency?: string;
  callerName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body: AlertCheckRequest = await req.json();
    
    // Validate input
    if (!body.callSessionId || typeof body.callSessionId !== 'string') {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { callSessionId, sentiment, satisfaction, urgency, callerName } = body;
    
    console.log('Checking alerts for call:', callSessionId, 'by user:', user.id);

    const alerts: Array<{
      call_session_id: string;
      alert_type: string;
      severity: string;
      title: string;
      message: string;
    }> = [];

    const safeCallerName = String(callerName || 'cliente').slice(0, 100);

    if (sentiment && ['negative', 'very_negative', 'frustrated', 'angry'].includes(String(sentiment).toLowerCase())) {
      alerts.push({
        call_session_id: callSessionId,
        alert_type: 'negative_sentiment',
        severity: String(sentiment).toLowerCase().includes('very') || String(sentiment).toLowerCase().includes('angry') ? 'critical' : 'warning',
        title: 'Sentimento Negativo Detectado',
        message: `A chamada com ${safeCallerName} apresentou sentimento negativo. Ação recomendada: acompanhamento do cliente.`
      });
    }

    if (satisfaction !== undefined && typeof satisfaction === 'number' && satisfaction < 6) {
      alerts.push({
        call_session_id: callSessionId,
        alert_type: 'low_satisfaction',
        severity: satisfaction < 4 ? 'critical' : 'warning',
        title: 'Satisfação Baixa',
        message: `Chamada com ${safeCallerName} teve satisfação de ${Math.min(10, Math.max(0, satisfaction))}/10.`
      });
    }

    if (urgency && ['high', 'critical', 'urgent'].includes(String(urgency).toLowerCase())) {
      alerts.push({
        call_session_id: callSessionId,
        alert_type: 'high_urgency',
        severity: String(urgency).toLowerCase() === 'critical' ? 'critical' : 'warning',
        title: 'Urgência Alta',
        message: `Chamada com ${safeCallerName} marcada como urgente. Priorize o atendimento.`
      });
    }

    if (alerts.length > 0) {
      const { error } = await supabaseAdmin.from('call_alerts').insert(alerts);
      if (error) {
        console.error('Error inserting alerts:', error);
        throw error;
      }
      console.log(`Created ${alerts.length} alerts for call ${callSessionId}`);
    }

    return new Response(
      JSON.stringify({ success: true, alertsCreated: alerts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in check-alerts:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
