import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { verifyWebhookSignature } from "../_shared/hmac.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { WebhookEventSchema } from "../_shared/external-payload-schemas.ts";
import { parseNumericSafely } from "../_shared/numeric-schemas.ts";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

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
        url: req.url,
        request_id: requestId,
      }
    });

    return new Response(JSON.stringify({ error: 'Invalid signature', request_id: requestId }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId }
    });
  }

  let rawPayload: unknown;
  try {
    rawPayload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON', request_id: requestId }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId }
    });
  }

  const parsed = await parseNumericSafely(WebhookEventSchema, rawPayload, {
    requestId,
    functionName: 'webhook-handler',
    field: 'event',
  });

  if (!parsed.ok) {
    return new Response(
      JSON.stringify({
        error: 'Payload de webhook inválido',
        issues: parsed.error.flatten(),
        request_id: requestId,
      }),
      {
        status: 422,
        headers: { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId }
      }
    );
  }

  console.log('[webhook]', requestId, 'event:', parsed.data.type, 'id:', parsed.data.id);

  return new Response(JSON.stringify({ success: true, request_id: requestId }), {
    headers: { ...cors, 'Content-Type': 'application/json', 'x-request-id': requestId }
  });
});
