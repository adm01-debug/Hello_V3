import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const startTime = performance.now();
    const metrics = [];
    const batchSize = 10;
    
    // Teste de Carga: Inserção em Lote
    const insertStart = performance.now();
    for (let i = 0; i < batchSize; i++) {
      const { data, error } = await supabaseClient
        .from('call_quality_metrics')
        .insert({
          agent_name: 'Load Test Bot',
          channel: 'SIP/test-trunk',
          mos_avg: 4.2 + (Math.random() * 0.5),
          jitter_avg_ms: 10 + (Math.random() * 20),
          packet_loss_pct: Math.random() * 2,
          rtt_avg_ms: 50 + (Math.random() * 30),
          quality_label: 'Good'
        })
        .select()
      
      if (error) throw error;
      if (data) metrics.push(data[0].id);
    }
    const insertEnd = performance.now();

    // Teste de Busca (Bottleneck check)
    const selectStart = performance.now();
    const { data: selectData, error: selectError } = await supabaseClient
      .from('call_quality_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (selectError) throw selectError;
    const selectEnd = performance.now();

    // Limpeza (opcional, mas bom para não poluir)
    // No load test real não deletaríamos, mas aqui vamos manter os logs por 1 hora
    
    const totalTime = performance.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total_duration_ms: totalTime,
          insert_latency_avg_ms: (insertEnd - insertStart) / batchSize,
          select_latency_ms: selectEnd - selectStart,
          batch_size: batchSize,
          records_processed: metrics.length,
          supabase_health: 'healthy'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
