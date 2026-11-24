import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientIpFromHeaders } from "../_shared/client-ip.ts";
import { checkRateLimitDB } from "../_shared/rate-limit.ts";
import { getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';

// A-021: conta inexistente, pedido pendente, pedido criado e falha ao listar usuarios
// respondem o mesmo corpo (status 200); distinguir os casos descobria quais emails existem.
const RESPOSTA_GENERICA = {
  success: true,
  message: 'Se o email existir, uma solicitação será enviada para aprovação.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Endpoint publico (usuario deslogado precisa resetar). Sem rate limit, o
    // auth.admin.listUsers() abaixo podia ser martelado por anonimos.
    const rl = await checkRateLimitDB(clientIpFromHeaders(req.headers) ?? "0.0.0.0", "request-password-reset");
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Limite excedido, tente novamente em instantes." }),
        { status: 429, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // Get IP address (validado como literal antes de gravar em auditoria)
    const clientIp = clientIpFromHeaders(req.headers);

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return new Response(
        JSON.stringify(RESPOSTA_GENERICA),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === sanitizedEmail);
    
    if (!user) {
      return new Response(
        JSON.stringify(RESPOSTA_GENERICA),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('user_email', sanitizedEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingRequest) {
      return new Response(
        JSON.stringify(RESPOSTA_GENERICA),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Create reset request
    const { error: insertError } = await supabase
      .from('password_reset_requests')
      .insert({
        user_id: user.id,
        user_email: sanitizedEmail,
        status: 'pending',
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent'),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    if (insertError) {
      console.error('Error creating reset request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create reset request' }),
        { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Create security alert for admins
    const { error: alertError } = await supabase.from('security_alerts').insert({
      alert_type: 'password_reset_request',
      severity: 'info',
      title: 'Nova Solicitação de Reset de Senha',
      description: `Solicitação de redefinição de senha recebida. Aguardando aprovação.`,
      source_user_email: sanitizedEmail,
      source_user_id: user.id,
      trigger_data: {
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent')
      }
    });
    // Best-effort: o pedido de reset ja existe; o alerta e aviso ao admin.
    if (alertError) console.error('request-password-reset: falha ao criar alerta de seguranca', alertError);

    return new Response(
      JSON.stringify(RESPOSTA_GENERICA),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in request-password-reset:', error);
    return internalErrorResponse(error, getCorrelationId(req), buildCorsHeaders(req), { fn: 'request-password-reset' });
  }
});
