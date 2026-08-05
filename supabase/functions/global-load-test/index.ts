import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-correlation-id, x-trace-id, x-trace-operation',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const scenarios = [
      { 
        table: 'call_sessions', 
        data: { 
          agent_name: 'Load Test Bot', 
          duration_seconds: 120, 
          direction: 'inbound',
          status: 'completed'
        } 
      },
      { 
        table: 'contacts', 
        data: { 
          name: 'Load Test Contact', 
          email: `test_${Date.now()}@example.com`,
          phone: '+5511999999999',
          source: 'load_test'
        } 
      },
      { 
        table: 'deals', 
        data: { 
          name: 'Load Test Deal', 
          value_cents: 1000000, 
          currency: 'BRL',
          stage: 'proposal',
          status: 'open'
        } 
      },
      { 
        table: 'audit_logs', 
        data: { 
          action: 'LOAD_TEST_EVENT', 
          resource_type: 'SYSTEM',
          details: { msg: 'Global load test automated run' } 
        } 
      }
    ]

    const results = []
    const iterations = 50 

    const startTime = performance.now()

    for (const scenario of scenarios) {
      const batchStart = performance.now()
      const payload = Array.from({ length: iterations }, () => ({
        ...scenario.data,
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
        system_status: totalTime < 5000 ? 'optimal' : 'degraded',
        latency_p50_ms: totalTime / (scenarios.length * iterations)
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
