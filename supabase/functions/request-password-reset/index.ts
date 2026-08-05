import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Se o email existir, uma solicitação será enviada para aprovação.'
        }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === sanitizedEmail);
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Se o email existir, uma solicitação será enviada para aprovação.'
        }),
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
        JSON.stringify({ 
          success: true, 
          message: 'Já existe uma solicitação pendente. Aguarde a aprovação de um administrador.'
        }),
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
    await supabase.from('security_alerts').insert({
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitação enviada. Um administrador irá revisar e aprovar seu pedido.'
      }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in request-password-reset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
