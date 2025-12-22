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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { callSessionId, sentiment, satisfaction, urgency, callerName }: AlertCheckRequest = await req.json();
    
    console.log('Checking alerts for call:', { callSessionId, sentiment, satisfaction, urgency });

    const alerts: Array<{
      call_session_id: string;
      alert_type: string;
      severity: string;
      title: string;
      message: string;
    }> = [];

    // Check for negative sentiment
    if (sentiment && ['negative', 'very_negative', 'frustrated', 'angry'].includes(sentiment.toLowerCase())) {
      alerts.push({
        call_session_id: callSessionId,
        alert_type: 'negative_sentiment',
        severity: sentiment.toLowerCase().includes('very') || sentiment.toLowerCase().includes('angry') ? 'critical' : 'warning',
        title: 'Sentimento Negativo Detectado',
        message: `A chamada com ${callerName || 'cliente'} apresentou sentimento ${sentiment}. Ação recomendada: acompanhamento do cliente.`
      });
    }

    // Check for low satisfaction
    if (satisfaction !== undefined && satisfaction < 6) {
      alerts.push({
        call_session_id: callSessionId,
        alert_type: 'low_satisfaction',
        severity: satisfaction < 4 ? 'critical' : 'warning',
        title: 'Satisfação Baixa',
        message: `Chamada com ${callerName || 'cliente'} teve satisfação de ${satisfaction}/10. Considere entrar em contato para resolução.`
      });
    }

    // Check for high urgency
    if (urgency && ['high', 'critical', 'urgent'].includes(urgency.toLowerCase())) {
      alerts.push({
        call_session_id: callSessionId,
        alert_type: 'high_urgency',
        severity: urgency.toLowerCase() === 'critical' ? 'critical' : 'warning',
        title: 'Urgência Alta',
        message: `Chamada com ${callerName || 'cliente'} marcada como ${urgency}. Priorize o atendimento.`
      });
    }

    // Insert alerts if any
    if (alerts.length > 0) {
      const { error } = await supabase.from('call_alerts').insert(alerts);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
