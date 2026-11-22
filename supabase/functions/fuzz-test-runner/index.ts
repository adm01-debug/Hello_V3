import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import fc from "https://esm.sh/fast-check"
import { buildCorsHeaders } from "../_shared/cors.ts"

// Alvos permitidos: apenas Edge Functions deste projeto. Um `target` arbitrário
// permitiria usar a função como proxy de requisições para qualquer host.
const ALLOWED_TARGETS = new Set([
  "analyze-call",
  "whatsapp-inbound",
  "bitrix-api",
  "elevenlabs-tts",
  "data-lake-flush",
])

serve(async (req) => {
  const cors = buildCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  // Fuzzing dispara até 100 requisições por chamada: exige admin autenticado.
  const authHeader = req.headers.get("Authorization") ?? ""
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: "Configuração ausente" }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: isAdminRpc, error: rpcError } = await supabase.rpc("is_admin_user", {
    _user_id: userData.user.id,
  })
  let isAdmin = !rpcError && isAdminRpc === true
  if (!isAdmin) {
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .eq("is_active", true)
      .maybeSingle()
    isAdmin = !!roleRow
  }
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const targetFunction = url.searchParams.get('target') || 'analyze-call'
  const mode = url.searchParams.get('mode') || 'generic' // 'generic' | 'numeric'

  if (!ALLOWED_TARGETS.has(targetFunction)) {
    return new Response(
      JSON.stringify({
        error: "Alvo não permitido",
        allowed_targets: [...ALLOWED_TARGETS],
      }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }

  const endpoint = `${supabaseUrl}/functions/v1/${targetFunction}`

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
  ]

  try {
    const results = []
    const runs = 100

    const startTime = performance.now()

    // Fuzzing loop
    for (let i = 0; i < runs; i++) {
      const payload = mode === 'numeric'
        ? hostileNumericSamples[i % hostileNumericSamples.length]
        : fc.sample(fc.anything(), 1)[0]

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify(payload)
      })

      results.push({
        status: res.status,
        passed: res.status === 400 || res.status === 422 || res.status === 401, // Expected for garbage data
      })
    }

    const totalTime = performance.now() - startTime

    return new Response(
      JSON.stringify({
        target: targetFunction,
        mode,
        total_runs: runs,
        duration_ms: totalTime,
        failures_caught: results.filter(r => r.passed).length,
        unexpected_successes: results.filter(r => !r.passed).length,
        system_integrity: results.every(r => r.passed) ? 'high' : 'compromised'
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  }
})