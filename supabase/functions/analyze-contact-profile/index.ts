import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { contactId } = await req.json();
    if (!contactId || typeof contactId !== 'string') {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts').select('id, name, company, position, notes').eq('id', contactId).single();

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: 'Contato não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: interactions } = await supabaseAdmin
      .from('contact_interactions')
      .select('interaction_type, direction, summary, sentiment, topics, duration_seconds, created_at')
      .eq('contact_id', contactId).order('created_at', { ascending: true }).limit(50);

    if (!interactions || interactions.length === 0) {
      return new Response(JSON.stringify({ error: 'Sem histórico suficiente' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const interactionsSummary = interactions.map((i, idx) => 
      `${idx + 1}. ${i.interaction_type} - ${i.sentiment || 'neutro'} - ${i.summary || 'sem resumo'}`
    ).join('\n').slice(0, 4000);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Analise o perfil do cliente ${contact.name} (${contact.company || ''}) com ${interactions.length} interações:\n${interactionsSummary}\n\nRetorne JSON: {"personality_traits":[],"communication_style":"","engagement_level":"baixo|médio|alto","sentiment_trend":"positivo|neutro|negativo","recommendations":[],"summary":""}`
        }],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    let profile;
    try {
      const jsonMatch = aiData.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
      profile = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch { profile = { summary: 'Análise não disponível' }; }

    await supabaseAdmin.from('contacts').update({ personality_insights: profile }).eq('id', contactId);

    return new Response(JSON.stringify({ success: true, profile, interactions_analyzed: interactions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
