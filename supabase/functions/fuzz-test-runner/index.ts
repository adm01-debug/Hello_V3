import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { fc } from "https://esm.sh/fast-check"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const targetFunction = url.searchParams.get('target') || 'analyze-call'
  const endpoint = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${targetFunction}`

  try {
    const results = []
    const runs = 100

    const startTime = performance.now()

    // Fuzzing loop
    for (let i = 0; i < runs; i++) {
      // Generate malformed payload
      const payload = fc.sample(fc.anything(), 1)[0]
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
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
        total_runs: runs,
        duration_ms: totalTime,
        failures_caught: results.filter(r => r.passed).length,
        unexpected_successes: results.filter(r => !r.passed).length,
        system_integrity: results.every(r => r.passed) ? 'high' : 'compromised'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
