import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonalityProfile {
  personality_traits: string[];
  communication_style: string;
  preferred_contact_time: string;
  interests: string[];
  pain_points: string[];
  buying_signals: string[];
  relationship_status: string;
  engagement_level: string;
  sentiment_trend: string;
  recommendations: string[];
  summary: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
  personality_insights: PersonalityProfile | null;
  updated_at: string;
}

interface AlertToCreate {
  contact_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  trigger_data: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting contact alerts check...');

    // Fetch all contacts with personality insights
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, phone, company, personality_insights, updated_at')
      .not('personality_insights', 'is', null);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      console.log('No contacts with profiles found');
      return new Response(
        JSON.stringify({ message: 'No contacts to check', alerts_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recent alerts to avoid duplicates (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: recentAlerts, error: alertsError } = await supabase
      .from('contact_alerts')
      .select('contact_id, alert_type')
      .gte('created_at', oneDayAgo.toISOString());

    if (alertsError) {
      console.error('Error fetching recent alerts:', alertsError);
    }

    const recentAlertKeys = new Set(
      (recentAlerts || []).map(a => `${a.contact_id}-${a.alert_type}`)
    );

    const alertsToCreate: AlertToCreate[] = [];

    for (const contact of contacts as Contact[]) {
      if (!contact.personality_insights) continue;
      
      const profile = contact.personality_insights as PersonalityProfile;
      const contactName = contact.name;

      // Check for buying signals
      if (profile.buying_signals && profile.buying_signals.length > 0) {
        const alertKey = `${contact.id}-buying_signal`;
        if (!recentAlertKeys.has(alertKey)) {
          alertsToCreate.push({
            contact_id: contact.id,
            alert_type: 'buying_signal',
            severity: 'critical',
            title: `🎯 Sinal de Compra Detectado`,
            message: `${contactName} apresenta sinais de compra: ${profile.buying_signals.slice(0, 2).join(', ')}`,
            trigger_data: {
              signals: profile.buying_signals,
              contact_name: contactName,
              company: contact.company
            }
          });
        }
      }

      // Check for negative sentiment
      const sentiment = profile.sentiment_trend?.toLowerCase();
      if (sentiment === 'negativo' || sentiment === 'piorando') {
        const alertKey = `${contact.id}-sentiment_negative`;
        if (!recentAlertKeys.has(alertKey)) {
          alertsToCreate.push({
            contact_id: contact.id,
            alert_type: 'sentiment_negative',
            severity: 'warning',
            title: `⚠️ Sentimento Negativo`,
            message: `${contactName} apresenta tendência de sentimento ${sentiment}. Recomenda-se ação imediata.`,
            trigger_data: {
              sentiment_trend: profile.sentiment_trend,
              pain_points: profile.pain_points,
              contact_name: contactName
            }
          });
        }
      }

      // Check for low engagement
      const engagement = profile.engagement_level?.toLowerCase();
      if (engagement === 'baixo') {
        const alertKey = `${contact.id}-low_engagement`;
        if (!recentAlertKeys.has(alertKey)) {
          alertsToCreate.push({
            contact_id: contact.id,
            alert_type: 'low_engagement',
            severity: 'info',
            title: `📉 Baixo Engajamento`,
            message: `${contactName} está com baixo nível de engajamento. Considere uma abordagem proativa.`,
            trigger_data: {
              engagement_level: profile.engagement_level,
              recommendations: profile.recommendations?.slice(0, 2),
              contact_name: contactName
            }
          });
        }
      }

      // Check for VIP contacts with no recent interaction
      if (profile.relationship_status === 'vip' || engagement === 'alto') {
        // Check last interaction
        const { data: lastInteraction } = await supabase
          .from('contact_interactions')
          .select('created_at')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastInteraction) {
          const lastInteractionDate = new Date(lastInteraction.created_at);
          const daysSinceInteraction = Math.floor(
            (Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceInteraction > 7) {
            const alertKey = `${contact.id}-vip_inactive`;
            if (!recentAlertKeys.has(alertKey)) {
              alertsToCreate.push({
                contact_id: contact.id,
                alert_type: 'vip_inactive',
                severity: 'warning',
                title: `👑 VIP Sem Contato Recente`,
                message: `${contactName} (VIP) não tem interação há ${daysSinceInteraction} dias. Priorize o follow-up.`,
                trigger_data: {
                  days_since_interaction: daysSinceInteraction,
                  relationship_status: profile.relationship_status,
                  contact_name: contactName
                }
              });
            }
          }
        }
      }
    }

    // Insert all alerts
    if (alertsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('contact_alerts')
        .insert(alertsToCreate);

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }

      console.log(`Created ${alertsToCreate.length} new alerts`);
    } else {
      console.log('No new alerts to create');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        contacts_checked: contacts.length,
        alerts_created: alertsToCreate.length,
        alerts: alertsToCreate.map(a => ({ type: a.alert_type, contact: a.trigger_data.contact_name }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-contact-alerts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
