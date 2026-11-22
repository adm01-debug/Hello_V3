import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCorsHeaders } from "../_shared/cors.ts";
import { verificarAssercao, WebAuthnError } from "./verify.ts";


interface AuthRequest {
  credentialId: string;
  /** Opcional: a edge deriva o dono pela credential_id registrada. */
  userId?: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  /** Ignorado: o e-mail vem do dono da passkey, nunca do request. */
  email?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const { credentialId, clientDataJSON, authenticatorData, signature } =
      await req.json() as AuthRequest;
    if (!credentialId || !clientDataJSON || !authenticatorData || !signature) {
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

    // Resolve a passkey pela credential_id (unica). O dono vem daqui, nunca
    // do body: um atacante nao pode assumir a conta de outro usuario.
    const { data: passkey, error: passkeyError } = await supabaseAdmin
      .from('user_passkeys')
      .select('id, user_id, public_key, counter')
      .eq('credential_id', credentialId)
      .single();

    if (passkeyError || !passkey) {
      console.error('Passkey verification failed:', passkeyError);
      throw new Error('Invalid passkey');
    }

    const userId = passkey.user_id;

    // Desafio: o mais recente ainda valido para este usuario. Consumido
    // logo abaixo para impedir replay.
    const { data: desafio } = await supabaseAdmin
      .from('webauthn_challenges')
      .select('id, challenge, expires_at')
      .eq('user_id', userId)
      .eq('type', 'authentication')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!desafio) {
      throw new Error('Challenge expirado. Tente novamente.');
    }

    const origensPermitidas = (Deno.env.get('WEBAUTHN_ALLOWED_ORIGINS') ??
      'https://hello-v3.vercel.app,https://lalamove.app')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    try {
      await verificarAssercao({
        clientDataJSON,
        authenticatorData,
        signature,
        challengeEsperado: desafio.challenge,
        publicKey: passkey.public_key as string,
        origensPermitidas,
      });
    } catch (erroVerificacao) {
      const codigo = erroVerificacao instanceof WebAuthnError
        ? erroVerificacao.code
        : 'desconhecido';
      console.error('WebAuthn assertion recusada:', codigo, erroVerificacao);
      throw new Error(`Passkey invalida (${codigo})`);
    }

    // Consome o desafio: uso unico.
    await supabaseAdmin.from('webauthn_challenges').delete().eq('id', desafio.id);

    // Generate a magic link token for the user
    // O e-mail NAO pode vir do corpo do request: a edge e publica, e um
    // atacante que conheca um credential_id valido poderia pedir magic
    // link para a propria caixa e assumir a conta. Derivamos do dono da
    // passkey, que e a unica fonte confiavel.
    const { data: dono, error: donoError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const emailDoDono = dono?.user?.email;
    if (donoError || !emailDoDono) {
      console.error('Dono da passkey sem e-mail:', donoError);
      throw new Error('Failed to resolve passkey owner');
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: emailDoDono,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://hello-v3.vercel.app'}/`,
      },
    });

    if (linkError) {
      console.error('Magic link generation failed:', linkError);
      throw new Error('Failed to generate authentication token');
    }

    // Log successful authentication
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      user_email: emailDoDono,
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
        userId,
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