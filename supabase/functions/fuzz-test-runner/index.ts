import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import fc from "https://esm.sh/fast-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-request-id, x-correlation-id, x-trace-id, x-trace-operation",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Antes: POST anonimo disparava 100 chamadas contra QUALQUER edge passada em ?target=,
  // com a anon key. Isso servia como canhao de carga contra o proprio projeto.
  const negado = await exigirAdmin(req);
  if (negado) return negado;

  const url = new URL(req.url);
  const targetFunction = url.searchParams.get("target") || "analyze-call";
  const mode = url.searchParams.get("mode") || "generic"; // 'generic' | 'numeric'
  if (!/^[a-z0-9-]{2,60}$/.test(targetFunction)) {
    return json({ error: "target invalido" }, 400);
  }
  const endpoint = `${
    Deno.env.get("SUPABASE_URL")
  }/functions/v1/${targetFunction}`;

  // Payloads numéricos hostis: garantem que Zod `.number().finite()` bloqueia.
  const hostileNumericSamples: unknown[] = [
    { amount: NaN },
    { amount: Infinity },
    { amount: -Infinity },
    { amount: "12abc" },
    { amount: null },
    { latitude: 999, longitude: -999 },
    { percent: 100.0001 },
    { count: 3.14 },
    { timestamp: -1 },
    { duration_ms: Number.MAX_SAFE_INTEGER * 2 },
  ];

  try {
    const results = [];
    const runs = 100;

    const startTime = performance.now();

    // Fuzzing loop
    for (let i = 0; i < runs; i++) {
      const payload = mode === "numeric"
        ? hostileNumericSamples[i % hostileNumericSamples.length]
        : fc.sample(fc.anything(), 1)[0];

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify(payload),
      });

      results.push({
        status: res.status,
        passed: res.status === 400 || res.status === 422 || res.status === 401, // Expected for garbage data
      });
    }

    const totalTime = performance.now() - startTime;

    return json({
      target: targetFunction,
      mode,
      total_runs: runs,
      duration_ms: totalTime,
      failures_caught: results.filter((r) => r.passed).length,
      unexpected_successes: results.filter((r) => !r.passed).length,
      system_integrity: results.every((r) => r.passed) ? "high" : "compromised",
    }, 200);
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "erro desconhecido",
    }, 500);
  }
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// 401 sem JWT valido; 403 se o perfil nao for admin/supervisor.
async function exigirAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Nao autorizado" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const comoUsuario = createClient(
    url,
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: authHeader } },
    },
  );
  const { data: { user }, error } = await comoUsuario.auth.getUser();
  if (error || !user) return json({ error: "Nao autorizado" }, 401);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !["admin", "supervisor"].includes(profile.role)) {
    return json({ error: "Acesso negado" }, 403);
  }
  return null;
}
