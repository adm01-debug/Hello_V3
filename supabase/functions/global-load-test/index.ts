import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const scenarios = [
      { table: 'calls', data: { status: 'completed', direction: 'inbound', duration: 120 } },
      { table: 'contacts', data: { first_name: 'Test', last_name: 'User', email: `test_${Date.now()}@example.com` } },
      { table: 'deals', data: { title: 'High Volume Deal', value: 10000, status: 'negotiation' } },
      { table: 'audit_logs', data: { action: 'SECURITY_AUDIT', severity: 'info', details: { msg: 'Load test event' } } }
    ]

    const results = []
    const iterations = 50 // Simulating volume

    const startTime = performance.now()

    for (const scenario of scenarios) {
      const batchStart = performance.now()
      const payload = Array.from({ length: iterations }, () => ({
        ...scenario.data,
        metadata: { load_test_id: crypto.randomUUID() }
      }))

      const { data, error } = await supabaseClient
        .from(scenario.table)
        .insert(payload)
        .select('id')

      results.push({
        entity: scenario.table,
        count: iterations,
        latency_ms: performance.now() - batchStart,
        success: !error,
        error: error?.message
      })
    }

    const totalTime = performance.now() - startTime

    return new Response(
      JSON.stringify({
        status: 'completed',
        total_scenarios: scenarios.length,
        total_records: scenarios.length * iterations,
        total_duration_ms: totalTime,
        breakdown: results,
        system_status: totalTime < 5000 ? 'optimal' : 'degraded'
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
