import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verify HMAC signature for incoming webhooks.
 * @param req The incoming Request
 * @param provider The provider name (e.g., 'stripe', 'twilio')
 * @param signatureHeader The header name containing the signature
 * @returns boolean indicating if the signature is valid
 */
export async function verifyWebhookSignature(
  req: Request,
  provider: string,
  signatureHeader: string
): Promise<boolean> {
  try {
    const signature = req.headers.get(signatureHeader);
    if (!signature) return false;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get secret from DB
    const { data: secretData, error } = await supabase
      .from('webhook_secrets')
      .select('secret_key')
      .eq('provider', provider)
      .single();

    if (error || !secretData) {
      console.error(`[webhook] Secret not found for provider: ${provider}`);
      return false;
    }

    const body = await req.clone().text();
    const hmac = createHmac('sha256', secretData.secret_key);
    const expectedSignature = hmac.update(body).digest('hex');

    // Constant-time comparison to prevent timing attacks
    return safeCompare(signature, expectedSignature);
  } catch (err) {
    console.error('[webhook] Signature verification error:', err);
    return false;
  }
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
