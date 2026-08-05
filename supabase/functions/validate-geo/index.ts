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

    // SEC-001 FIX: Extract userId from JWT when available, fallback for unauthenticated geo checks
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get IP and country from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const cfCountry = req.headers.get('cf-ipcountry');
    
    const clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

    // Check if geo blocking is enabled
    const { data: settings } = await supabase
      .from('geo_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.enabled) {
      return new Response(
        JSON.stringify({ allowed: true, reason: 'Geo blocking disabled' }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Get country code
    let countryCode = cfCountry;
    let countryName = '';
    let region = '';
    let city = '';

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

    if (!countryCode) {
      return new Response(
        JSON.stringify({ allowed: true, reason: 'Country unknown' }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Check if country is in allowlist
    const { data: allowedCountries } = await supabase
      .from('geo_restrictions')
      .select('country_code')
      .eq('restriction_type', 'allow');

    const isAllowed = allowedCountries?.some(c => c.country_code === countryCode) ?? false;

    if (!allowedCountries || allowedCountries.length === 0) {
      return new Response(
        JSON.stringify({ allowed: true, reason: 'Allowlist not configured' }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (isAllowed) {
      if (settings.log_blocked_attempts) {
        await supabase.from('geo_access_logs').insert({
          action: 'allowed',
          ip_address: clientIp || 'unknown',
          country_code: countryCode,
          country_name: countryName,
          region,
          city,
          user_id: userId,
          user_email: userEmail,
          user_agent: req.headers.get('user-agent'),
          reason: 'Country in allowlist'
        });
      }

      return new Response(
        JSON.stringify({ allowed: true, country: countryCode, countryName }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Country not in allowlist - block
    if (settings.log_blocked_attempts) {
      await supabase.from('geo_access_logs').insert({
        action: 'blocked',
        ip_address: clientIp || 'unknown',
        country_code: countryCode,
        country_name: countryName,
        region,
        city,
        user_id: userId,
        user_email: userEmail,
        user_agent: req.headers.get('user-agent'),
        reason: 'Country not in allowlist'
      });
    }

    if (settings.notify_on_block) {
      await supabase.from('security_alerts').insert({
        alert_type: 'geo_blocked',
        severity: 'warning',
        title: 'Acesso Geográfico Bloqueado',
        description: `Tentativa de acesso de ${countryName || countryCode} (IP: ${clientIp})`,
        source_user_id: userId,
        source_user_email: userEmail,
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
      { status: 403, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Geo validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ allowed: true, error: errorMessage }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
