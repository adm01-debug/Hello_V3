import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const { data: contacts } = await supabaseAdmin
      .from('contacts').select('id, name, personality_insights').not('personality_insights', 'is', null);

    if (!contacts?.length) {
      return new Response(JSON.stringify({ message: 'Sem contatos', alerts_created: 0 }), {
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: recentAlerts } = await supabaseAdmin
      .from('contact_alerts').select('contact_id, alert_type').gte('created_at', oneDayAgo);

    const recentAlertKeys = new Set((recentAlerts || []).map(a => `${a.contact_id}-${a.alert_type}`));

    interface ContactAlert {
      contact_id: string;
      alert_type: string;
      severity: string;
      title: string;
      message: string;
      trigger_data: Record<string, unknown>;
    }
    const alertsToCreate: ContactAlert[] = [];

    for (const contact of contacts) {
      const profile = contact.personality_insights as {
        buying_signals?: unknown[];
        sentiment_trend?: string;
      } | null;
      if (!profile) continue;

      if (profile.buying_signals?.length && !recentAlertKeys.has(`${contact.id}-buying_signal`)) {
        alertsToCreate.push({
          contact_id: contact.id, alert_type: 'buying_signal', severity: 'critical',
          title: 'Sinal de Compra Detectado', message: `${contact.name} apresenta sinais de compra`,
          trigger_data: { signals: profile.buying_signals }
        });
      }

      if (['negativo', 'piorando'].includes(profile.sentiment_trend?.toLowerCase()) && 
          !recentAlertKeys.has(`${contact.id}-sentiment_negative`)) {
        alertsToCreate.push({
          contact_id: contact.id, alert_type: 'sentiment_negative', severity: 'warning',
          title: 'Sentimento Negativo', message: `${contact.name} apresenta tendência negativa`,
          trigger_data: { sentiment_trend: profile.sentiment_trend }
        });
      }
    }

    if (alertsToCreate.length > 0) {
      await supabaseAdmin.from('contact_alerts').insert(alertsToCreate);
    }

    return new Response(JSON.stringify({ success: true, contacts_checked: contacts.length, alerts_created: alertsToCreate.length }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
