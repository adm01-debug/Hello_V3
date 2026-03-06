import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface WavoipCallRequest {
  action: 'start' | 'end' | 'status' | 'connect';
  whatsappId?: string;
  callId?: string;
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

    const wavoipToken = Deno.env.get('WAVOIP_TOKEN');
    
    if (!wavoipToken) {
      console.error('WAVOIP_TOKEN not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Serviço não configurado' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WavoipCallRequest = await req.json();
    
    if (!body.action || typeof body.action !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, whatsappId, callId } = body;
    console.log(`Wavoip action: ${action} by user: ${user.id}`);

    let response;

    switch (action) {
      case 'connect':
        response = { success: true, connected: true, message: 'Conexão estabelecida' };
        break;

      case 'start':
        if (!whatsappId || typeof whatsappId !== 'string') {
          return new Response(
            JSON.stringify({ success: false, error: 'Número WhatsApp é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const formattedPhone = whatsappId.replace(/\D/g, '').slice(0, 20);
        response = {
          success: true,
          callId: `wavoip-${Date.now()}`,
          status: 'connecting',
          message: `Iniciando chamada para ${formattedPhone}`
        };
        break;

      case 'end':
        if (!callId || typeof callId !== 'string') {
          return new Response(
            JSON.stringify({ success: false, error: 'Call ID é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        response = { success: true, callId, status: 'ended', message: 'Chamada encerrada' };
        break;

      case 'status':
        response = { success: true, connected: true, status: 'ready' };
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Wavoip error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
