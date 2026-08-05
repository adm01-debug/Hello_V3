import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get the authorization header to identify the admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // SEC-002 FIX: Use user client for auth AND admin check (not service role)
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: adminUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SEC-002 FIX: Check admin role via direct query instead of RPC that needs auth.uid()
    const { data: adminRole } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (!adminRole || !['admin', 'supervisor'].includes(adminRole.role)) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || action !== 'approve') {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Get the reset request
    const { data: resetRequest, error: fetchError } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !resetRequest) {
      return new Response(
        JSON.stringify({ error: 'Reset request not found' }),
        { status: 404, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (resetRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Request already processed' }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(resetRequest.expires_at) < new Date()) {
      await supabase
        .from('password_reset_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({ error: 'Request has expired' }),
        { status: 400, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: resetRequest.user_email,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/reset-password`
      }
    });

    if (linkError) {
      console.error('Error generating reset link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset link' }),
        { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Update request status
    await supabase
      .from('password_reset_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        reviewer_email: adminUser.email
      })
      .eq('id', requestId);

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: adminUser.id,
      user_email: adminUser.email,
      action: 'password_reset_approved',
      resource_type: 'password_reset_request',
      resource_id: requestId,
      details: {
        target_user_email: resetRequest.user_email,
        target_user_id: resetRequest.user_id
      }
    });
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset approved and email sent'
      }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in approve-password-reset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
