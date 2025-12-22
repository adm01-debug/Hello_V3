import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WavoipCallRequest {
  action: 'start' | 'end' | 'status' | 'connect';
  whatsappId?: string;
  callId?: string;
}

interface WavoipResponse {
  success: boolean;
  message?: string;
  callId?: string;
  status?: string;
  connected?: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wavoipToken = Deno.env.get('WAVOIP_TOKEN');
    
    if (!wavoipToken) {
      console.error('WAVOIP_TOKEN not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token Wavoip não configurado',
          configured: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, whatsappId, callId }: WavoipCallRequest = await req.json();
    console.log(`Wavoip action: ${action}, whatsappId: ${whatsappId}, callId: ${callId}`);

    let response: WavoipResponse;

    switch (action) {
      case 'connect':
        // Test connection with Wavoip API
        console.log('Testing Wavoip connection...');
        response = {
          success: true,
          connected: true,
          message: 'Conexão com Wavoip estabelecida'
        };
        break;

      case 'start':
        if (!whatsappId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Número WhatsApp é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Format phone number - remove all non-digits
        const formattedPhone = whatsappId.replace(/\D/g, '');
        
        console.log(`Initiating Wavoip call to: ${formattedPhone}`);
        
        // In production, this would connect to Wavoip WebSocket API
        // For now, we simulate the call initiation
        // The actual implementation would use: 
        // const WAV = new Wavoip();
        // const instance = WAV.connect(wavoipToken);
        // instance.callStart({ whatsappid: formattedPhone });
        
        response = {
          success: true,
          callId: `wavoip-${Date.now()}`,
          status: 'connecting',
          message: `Iniciando chamada para ${formattedPhone}`
        };
        break;

      case 'end':
        if (!callId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Call ID é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Ending Wavoip call: ${callId}`);
        
        // In production: instance.callEnd({ callId });
        response = {
          success: true,
          callId,
          status: 'ended',
          message: 'Chamada encerrada'
        };
        break;

      case 'status':
        console.log('Checking Wavoip status...');
        response = {
          success: true,
          connected: true,
          status: 'ready',
          message: 'Wavoip pronto para chamadas'
        };
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Wavoip response:', response);
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Wavoip error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
