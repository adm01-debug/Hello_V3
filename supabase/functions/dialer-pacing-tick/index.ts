// Tick do discador preditivo — invocado por pg_cron a cada minuto ou manualmente.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = corsHeaders as Record<string, string>;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const negado = await exigirPermissao(req, url, service);
  if (negado) return negado;

  try {
    const supabase = createClient(url, service);
    const { data, error } = await supabase.rpc("apply_predictive_pacing");
    if (error) throw error;

    return new Response(JSON.stringify(data ?? {}), {
      headers: { ...CORS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...CORS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Sem isso a anon key publica bastava para reajustar o ritmo de discagem de todas
// as campanhas ativas. Aceita o cron (token dedicado) ou admin/supervisor.
async function exigirPermissao(
  req: Request,
  supabaseUrl: string,
  serviceKey: string,
): Promise<Response | null> {
  const negar = (status: number, msg: string) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return negar(401, "Nao autorizado");

  const cronToken = Deno.env.get("DIALER_CRON_TOKEN");
  if (cronToken && mesmaString(authHeader, `Bearer ${cronToken}`)) return null;

  const comoUsuario = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error } = await comoUsuario.auth.getUser();
  if (error || !user) return negar(401, "Nao autorizado");

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: isAdmin } = await admin.rpc("is_admin_user", { _user_id: user.id });
  if (!isAdmin) {
    return negar(403, "Acesso negado");
  }
  return null;
}

function mesmaString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
