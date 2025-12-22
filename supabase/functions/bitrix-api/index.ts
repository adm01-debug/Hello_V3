import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BitrixRequest {
  action: 'get_contacts' | 'get_leads' | 'create_lead' | 'update_lead' | 'get_deals' | 'create_call' | 'register_call' | 'finish_call' | 'get_user';
  params?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('BITRIX_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('BITRIX_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Bitrix não configurado',
          configured: false,
          message: 'Configure a URL do webhook do Bitrix24 nas configurações'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, params } = await req.json() as BitrixRequest;
    console.log(`Bitrix API action: ${action}`, params);

    let endpoint = '';
    let method = 'GET';
    let body: Record<string, unknown> | null = null;

    switch (action) {
      // CRM - Contacts
      case 'get_contacts':
        endpoint = 'crm.contact.list';
        body = params || {};
        break;

      // CRM - Leads
      case 'get_leads':
        endpoint = 'crm.lead.list';
        body = params || {};
        break;

      case 'create_lead':
        endpoint = 'crm.lead.add';
        method = 'POST';
        body = { fields: params };
        break;

      case 'update_lead':
        endpoint = 'crm.lead.update';
        method = 'POST';
        body = params || {};
        break;

      // CRM - Deals
      case 'get_deals':
        endpoint = 'crm.deal.list';
        body = params || {};
        break;

      // Telephony
      case 'create_call':
        endpoint = 'telephony.externalcall.register';
        method = 'POST';
        body = params || {};
        break;

      case 'register_call':
        endpoint = 'telephony.externalcall.register';
        method = 'POST';
        body = params || {};
        break;

      case 'finish_call':
        endpoint = 'telephony.externalcall.finish';
        method = 'POST';
        body = params || {};
        break;

      // User
      case 'get_user':
        endpoint = 'user.current';
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não suportada', action }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const url = `${webhookUrl}${endpoint}`;
    console.log(`Calling Bitrix API: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json();
    console.log('Bitrix API response:', JSON.stringify(data).substring(0, 500));

    if (data.error) {
      console.error('Bitrix API error:', data.error, data.error_description);
      return new Response(
        JSON.stringify({ 
          error: data.error_description || data.error,
          bitrix_error: data.error 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data.result,
        total: data.total,
        configured: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bitrix-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
