import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get IP from various headers (proxy support)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    let clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);
    
    // Parse body for user info
    const body = await req.json();
    const { userId, userEmail } = body;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user has IP restriction enabled
    const { data: restriction } = await supabase
      .from('user_ip_restrictions')
      .select('enabled')
      .eq('user_id', userId)
      .single();
    
    // If no restriction config or disabled, allow access
    if (!restriction || !restriction.enabled) {
      console.log(`IP validation: No restriction for user ${userId}, allowing access`);
      return new Response(
        JSON.stringify({ allowed: true, reason: 'No IP restriction configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          // Check CIDR using PostgreSQL
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
      console.log(`IP validation: BLOCKED - User ${userId} from IP ${clientIp}`);
      
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
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`IP validation: ALLOWED - User ${userId} from IP ${clientIp}`);
    
    return new Response(
      JSON.stringify({ allowed: true, ip: clientIp }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('IP validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});