import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";


interface BitrixRequest {
  action: 'get_contacts' | 'get_leads' | 'create_lead' | 'update_lead' | 'get_deals' | 'create_call' | 'register_call' | 'finish_call' | 'get_user';
  params?: Record<string, unknown>;
}

function buildWebhookBaseUrl(rawWebhookUrl: string | undefined): URL | null {
  const value = rawWebhookUrl?.trim();
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const withTrailingSlash = withProtocol.endsWith('/') ? withProtocol : `${withProtocol}/`;

  try {
    return new URL(withTrailingSlash);
  } catch {
    return null;
  }
}

 export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       return new Response(JSON.stringify({ error: 'Não autorizado' }), {
         status: 401,
         headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
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
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as BitrixRequest;
    
    if (!body.action || typeof body.action !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { action, params } = body;

    const webhookBaseUrl = buildWebhookBaseUrl(Deno.env.get('BITRIX_WEBHOOK_URL'));
    if (!webhookBaseUrl) {
      console.error('BITRIX_WEBHOOK_URL not configured');

      if (action === 'get_user') {
        return new Response(
          JSON.stringify({ success: true, configured: false, message: 'Serviço não configurado' }),
          { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Serviço não configurado', configured: false }),
        { status: 503, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
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
          { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
    }

    const url = new URL(endpoint, webhookBaseUrl).toString();

    const controller = new AbortController();
    const timeoutMs = 12000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
        signal: controller.signal,
      });
    } catch (fetchError) {
      const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError';
      const message = isTimeout
        ? 'Tempo limite de conexão com Bitrix excedido'
        : 'Não foi possível conectar ao Bitrix';

      console.error('Bitrix request error:', message, fetchError);

      if (action === 'get_user') {
        return new Response(
          JSON.stringify({ success: true, configured: false, message }),
          { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: message, configured: true }),
        {
          status: isTimeout ? 504 : 502,
          headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = await response.text();
    let data: Record<string, unknown>;

    try {
      data = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      console.error('Bitrix API returned non-JSON response');
      return new Response(
        JSON.stringify({ error: 'Configuração inválida do webhook', configured: false }),
        { status: 503, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.error('Bitrix HTTP error:', response.status, data);
      return new Response(
        JSON.stringify({ error: 'Erro na integração', configured: true }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (data.error) {
      console.error('Bitrix API error:', data.error);
      return new Response(
        JSON.stringify({ error: 'Erro na integração' }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data.result, total: data.total }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

   } catch (error) {
     console.error('Error in bitrix-api function:', error);
     return new Response(
       JSON.stringify({ error: 'Erro interno' }),
       { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
     );
   }
 };
 
 serve(handler);
