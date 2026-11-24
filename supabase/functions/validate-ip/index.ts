import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientIpFromHeaders } from "../_shared/client-ip.ts";
import { ipMatchesAny } from "../_shared/ip-range.ts";
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId } from '../_shared/errors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // SEC-001 FIX: Extract userId from JWT, not from request body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email || '';

    // Header e controlado pelo cliente: sem validação, a whitelist de IP é
    // anulável por quem sabe forjar x-forwarded-for.
    const clientIp = clientIpFromHeaders(req.headers);

    // Create service client for admin queries
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user has IP restriction enabled
    const { data: restriction } = await supabase
      .from('user_ip_restrictions')
      .select('enabled')
      .eq('user_id', userId)
      .single();
    
    // If no restriction config or disabled, allow access
    if (!restriction || !restriction.enabled) {
      return new Response(
        JSON.stringify({ allowed: true, reason: 'No IP restriction configured' }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    
    // Uma consulta por lista. Antes cada faixa cadastrada custava uma ida ao
    // banco (`check_ip_in_cidr` em laco) no caminho que libera o acesso.
    let isAllowed = false;

    if (clientIp) {
      const { data: globalWhitelist } = await supabase
        .from('ip_whitelist')
        .select('ip_address, is_cidr');

      isAllowed = ipMatchesAny(clientIp, globalWhitelist);
    }

    // If not in global, check user-specific whitelist
    if (!isAllowed && clientIp) {
      const { data: userWhitelist } = await supabase
        .from('user_allowed_ips')
        .select('ip_address, is_cidr')
        .eq('user_id', userId);

      isAllowed = ipMatchesAny(clientIp, userWhitelist);
    }
    
    // Log blocked access
    if (!isAllowed) {
      const { error: ipBlockErr } = await supabase
        .from('blocked_access_logs')
        .insert({
          user_id: userId,
          user_email: userEmail,
          ip_address: clientIp || 'unknown',
          reason: 'IP not in whitelist',
          user_agent: req.headers.get('user-agent')
        });
      if (ipBlockErr) console.error('validate-ip: falha ao registrar bloqueio por IP', ipBlockErr);
      
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'IP address not authorized',
          ip: clientIp 
        }),
        { status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ allowed: true, ip: clientIp }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('IP validation error:', error);
    return new Response(
      JSON.stringify({ code: 'internal_error', message: GENERIC_INTERNAL_MESSAGE, correlation_id: getCorrelationId(req) }),
      { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
