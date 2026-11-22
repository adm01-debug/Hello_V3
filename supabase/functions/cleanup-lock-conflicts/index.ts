import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

type CorsHeaders = Record<string, string>;

// deno-lint-ignore no-explicit-any -- o client real vem tipado com "public"; o default do generico e never
async function purge(admin: SupabaseClient<any, any, any>, cors: CorsHeaders): Promise<Response> {
  const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

  const { data: deleted, error: delErr } = await admin
    .from('optimistic_lock_conflicts')
    .delete()
    .lt('attempted_at', cutoff)
    .select('id');

  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { data: oldest } = await admin
    .from('optimistic_lock_conflicts')
    .select('attempted_at')
    .order('attempted_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return new Response(
    JSON.stringify({
      deleted_count: deleted?.length ?? 0,
      oldest_remaining: oldest?.attempted_at ?? null,
      cutoff,
    }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
  );
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Caminho do cron: a purga semanal roda por pg_cron, que nao tem JWT de
    // admin. Usa token dedicado comparado em tempo constante, mesmo padrao de
    // dialer-pacing-tick e generate-coaching-track. Sem isso a retencao de 90d
    // prometida pela ADR-044 nunca aconteceria.
    const cronToken = Deno.env.get('CLEANUP_CRON_TOKEN');
    const isCron = !!cronToken && authHeader === `Bearer ${cronToken}`;

    if (isCron) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      return await purge(admin, cors);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Apenas admin pode invocar manualmente -- papel lido de user_roles.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc('is_admin_user', { _user_id: claims.claims.sub as string });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return await purge(admin, cors);
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
