import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { verifyWebhookSignature } from "../_shared/hmac.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  // 1. Verify Signature
  const isValid = await verifyWebhookSignature(req, 'generic-provider', 'x-webhook-signature');
  
  if (!isValid) {
    // Audit failed attempt
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('audit_logs').insert({
      action: 'WEBHOOK_SIGNATURE_FAILURE',
      resource_type: 'webhook',
      resource_id: 'generic-handler',
      details: {
        ip: req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
        url: req.url
      }
    });

    return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
      status: 401, 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const payload = await req.json();
    console.log('[webhook] Payload received:', payload);

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
      status: 400, 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    });
  }
});
