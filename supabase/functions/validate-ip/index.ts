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

    // Get IP from various headers (proxy support)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    const clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

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
    
    // Check if IP is in global whitelist
    const { data: globalWhitelist } = await supabase
      .from('ip_whitelist')
      .select('*');
    
    let isAllowed = false;
    
    if (globalWhitelist && clientIp) {
      for (const entry of globalWhitelist) {
        if (entry.is_cidr) {
          const { data: cidrCheck } = await supabase.rpc('check_ip_in_cidr', {
            p_ip: clientIp,
            p_cidr: entry.ip_address
          });
          if (cidrCheck) {
            isAllowed = true;
            break;
          }
        } else if (entry.ip_address === clientIp) {
          isAllowed = true;
          break;
        }
      }
    }
    
    // If not in global, check user-specific whitelist
    if (!isAllowed && clientIp) {
      const { data: userWhitelist } = await supabase
        .from('user_allowed_ips')
        .select('*')
        .eq('user_id', userId);
      
      if (userWhitelist) {
        for (const entry of userWhitelist) {
          if (entry.is_cidr) {
            const { data: cidrCheck } = await supabase.rpc('check_ip_in_cidr', {
              p_ip: clientIp,
              p_cidr: entry.ip_address
            });
            if (cidrCheck) {
              isAllowed = true;
              break;
            }
          } else if (entry.ip_address === clientIp) {
            isAllowed = true;
            break;
          }
        }
      }
    }
    
    // Log blocked access
    if (!isAllowed) {
      await supabase
        .from('blocked_access_logs')
        .insert({
          user_id: userId,
          user_email: userEmail,
          ip_address: clientIp || 'unknown',
          reason: 'IP not in whitelist',
          user_agent: req.headers.get('user-agent')
        });
      
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
