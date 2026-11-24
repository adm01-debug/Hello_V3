import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientIpFromHeaders } from "../_shared/client-ip.ts";
import { checkRateLimitDB } from "../_shared/rate-limit.ts";
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId } from '../_shared/errors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Endpoint publico (chamado antes do login para checar geo do acesso). Sem
    // limite, cada request anonimo consumia uma chamada ao provedor externo.
    const rl = await checkRateLimitDB(clientIpFromHeaders(req.headers) ?? "0.0.0.0", "validate-geo");
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Limite excedido, tente novamente em instantes." }),
        { status: 429, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

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
    const cfCountry = req.headers.get('cf-ipcountry');
    
    // Header e controlado pelo cliente: o valor so pode chegar na URL do provedor
    // de geo e no log de acesso depois de validado como IP literal.
    const clientIp = clientIpFromHeaders(req.headers);

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
        const { error: geoAllowErr } = await supabase.from('geo_access_logs').insert({
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
        if (geoAllowErr) console.error('validate-geo: falha ao registrar acesso permitido', geoAllowErr);
      }

      return new Response(
        JSON.stringify({ allowed: true, country: countryCode, countryName }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Country not in allowlist - block
    if (settings.log_blocked_attempts) {
      const { error: geoBlockErr } = await supabase.from('geo_access_logs').insert({
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
      if (geoBlockErr) console.error('validate-geo: falha ao registrar acesso bloqueado', geoBlockErr);
    }

    if (settings.notify_on_block) {
      const { error: geoNotifyErr } = await supabase.from('security_alerts').insert({
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
      if (geoNotifyErr) console.error('validate-geo: falha ao criar alerta geografico', geoNotifyErr);
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
    // Falha aberta por decisao de negocio: nao bloqueia o usuario se a checagem cair.
    return new Response(
      JSON.stringify({ allowed: true, code: 'internal_error', message: GENERIC_INTERNAL_MESSAGE, correlation_id: getCorrelationId(req) }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
