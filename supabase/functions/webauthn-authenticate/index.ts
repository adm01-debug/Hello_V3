import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders } from "../_shared/cors.ts";


interface AuthRequest {
  credentialId: string;
  userId: string;
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const { credentialId, userId, email } = await req.json() as AuthRequest;
    if (!credentialId || !userId || !email) {
      throw new Error('Missing required fields');
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the passkey exists and belongs to the user
    const { data: passkey, error: passkeyError } = await supabaseAdmin
      .from('user_passkeys')
      .select('id, user_id')
      .eq('credential_id', credentialId)
      .eq('user_id', userId)
      .single();

    if (passkeyError || !passkey) {
      console.error('Passkey verification failed:', passkeyError);
      throw new Error('Invalid passkey');
    }

    // Generate a magic link token for the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://localhost:3000'}/`,
      },
    });

    if (linkError) {
      console.error('Magic link generation failed:', linkError);
      throw new Error('Failed to generate authentication token');
    }

    // Log successful authentication
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      user_email: email,
      action: 'webauthn_login',
      resource_type: 'authentication',
      details: {
        credential_id: credentialId,
        method: 'passkey',
      },
    });
    return new Response(
      JSON.stringify({
        success: true,
        token: linkData.properties?.hashed_token,
        action_link: linkData.properties?.action_link,
      }),
      {
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
