import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BitrixRequest {
  action: 'get_contacts' | 'get_leads' | 'create_lead' | 'update_lead' | 'get_deals' | 'create_call' | 'register_call' | 'finish_call' | 'get_user';
  params?: Record<string, unknown>;
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

    const webhookUrl = Deno.env.get('BITRIX_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('BITRIX_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço não configurado' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as BitrixRequest;
    
    if (!body.action || typeof body.action !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, params } = body;
    console.log(`Bitrix API action: ${action} by user: ${user.id}`);

    let endpoint = '';

    switch (action) {
      case 'get_contacts':
        endpoint = 'crm.contact.list';
        break;
      case 'get_leads':
        endpoint = 'crm.lead.list';
        break;
      case 'create_lead':
        endpoint = 'crm.lead.add';
        break;
      case 'update_lead':
        endpoint = 'crm.lead.update';
        break;
      case 'get_deals':
        endpoint = 'crm.deal.list';
        break;
      case 'create_call':
      case 'register_call':
        endpoint = 'telephony.externalcall.register';
        break;
      case 'finish_call':
        endpoint = 'telephony.externalcall.finish';
        break;
      case 'get_user':
        endpoint = 'user.current';
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não suportada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const url = `${webhookUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Bitrix API error:', data.error);
      return new Response(
        JSON.stringify({ error: 'Erro na integração' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data.result, total: data.total }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bitrix-api function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
