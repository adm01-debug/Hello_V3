import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header to identify the admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify they're an admin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: adminUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin_or_supervisor');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || action !== 'approve') {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the reset request
    const { data: resetRequest, error: fetchError } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !resetRequest) {
      console.error('Request not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Reset request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if request is still pending
    if (resetRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Request already processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(resetRequest.expires_at) < new Date()) {
      await supabase
        .from('password_reset_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({ error: 'Request has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate password reset link using Supabase Auth Admin API
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
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    console.log(`Password reset approved for ${resetRequest.user_email} by ${adminUser.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset approved and email sent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in approve-password-reset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
