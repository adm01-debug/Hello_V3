import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip, cf-ipcountry, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get IP and country from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const cfCountry = req.headers.get('cf-ipcountry');
    
    const clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);
    
    // Parse body for user info
    let body: { userId?: string; userEmail?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }
    const { userId, userEmail } = body;

    // Check if geo blocking is enabled
    const { data: settings } = await supabase
      .from('geo_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    // If not enabled, allow access
    if (!settings || !settings.enabled) {
      console.log('Geo blocking disabled, allowing access');
      return new Response(
        JSON.stringify({ allowed: true, reason: 'Geo blocking disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get country code - try Cloudflare header first, then fallback to IP lookup
    let countryCode = cfCountry;
    let countryName = '';
    let region = '';
    let city = '';

    // If no Cloudflare header, try IP geolocation service
    if (!countryCode && clientIp) {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,countryCode,regionName,city`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            countryCode = geoData.countryCode;
            countryName = geoData.country;
            region = geoData.regionName;
            city = geoData.city;
          }
        }
      } catch (e) {
        console.error('Geo lookup failed:', e);
      }
    }

    // If still no country, allow (fail open) but log
    if (!countryCode) {
      console.log('Could not determine country, allowing access');
      return new Response(
        JSON.stringify({ allowed: true, reason: 'Country unknown' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if country is in allowlist (whitelist mode)
    const { data: allowedCountries } = await supabase
      .from('geo_restrictions')
      .select('country_code')
      .eq('restriction_type', 'allow');

    const isAllowed = allowedCountries?.some(c => c.country_code === countryCode) ?? false;

    // If no countries in allowlist, allow all (not configured yet)
    if (!allowedCountries || allowedCountries.length === 0) {
      console.log('No countries in allowlist, allowing access');
      return new Response(
        JSON.stringify({ allowed: true, reason: 'Allowlist not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isAllowed) {
      console.log(`Geo validation: ALLOWED - Country ${countryCode} is in allowlist`);
      
      // Log allowed access if logging is enabled
      if (settings.log_blocked_attempts) {
        await supabase.from('geo_access_logs').insert({
          action: 'allowed',
          ip_address: clientIp || 'unknown',
          country_code: countryCode,
          country_name: countryName,
          region,
          city,
          user_id: userId || null,
          user_email: userEmail || null,
          user_agent: req.headers.get('user-agent'),
          reason: 'Country in allowlist'
        });
      }

      return new Response(
        JSON.stringify({ 
          allowed: true, 
          country: countryCode,
          countryName 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Country not in allowlist - block
    console.log(`Geo validation: BLOCKED - Country ${countryCode} not in allowlist`);

    // Log blocked access
    if (settings.log_blocked_attempts) {
      await supabase.from('geo_access_logs').insert({
        action: 'blocked',
        ip_address: clientIp || 'unknown',
        country_code: countryCode,
        country_name: countryName,
        region,
        city,
        user_id: userId || null,
        user_email: userEmail || null,
        user_agent: req.headers.get('user-agent'),
        reason: 'Country not in allowlist'
      });
    }

    // Create security alert if notify is enabled
    if (settings.notify_on_block) {
      await supabase.from('security_alerts').insert({
        alert_type: 'geo_blocked',
        severity: 'warning',
        title: 'Acesso Geográfico Bloqueado',
        description: `Tentativa de acesso de ${countryName || countryCode} (IP: ${clientIp})`,
        source_user_id: userId || null,
        source_user_email: userEmail || null,
        trigger_data: {
          country_code: countryCode,
          country_name: countryName,
          ip_address: clientIp,
          city,
          region
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        allowed: false, 
        reason: 'País não permitido',
        country: countryCode,
        countryName
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Geo validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Fail open on errors
    return new Response(
      JSON.stringify({ allowed: true, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
