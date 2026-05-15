import { supabase } from './src/integrations/supabase/client';

async function runLoadTest(iterations = 50) {
  console.log(`🚀 Iniciando teste de carga: ${iterations} iterações...`);
  const start = Date.now();
  const results = {
    success: 0,
    error: 0,
    latencies: [] as number[],
  };

  const tasks = Array.from({ length: iterations }).map(async (_, i) => {
    const iterStart = Date.now();
    try {
      // Simula uma consulta pesada que um dashboard faria
      const { error } = await supabase
        .from('call_sessions')
        .select('*, call_control_audit_logs(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const duration = Date.now() - iterStart;
      results.success++;
      results.latencies.push(duration);
    } catch (err) {
      results.error++;
      console.error(`Erro na iteração ${i}:`, err);
    }
  });

  await Promise.all(tasks);
  const totalDuration = Date.now() - start;
  const avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
  const p95Latency = results.latencies.sort((a, b) => a - b)[Math.floor(results.latencies.length * 0.95)] || 0;

  console.log('\n📊 --- RESULTADOS DO TESTE DE CARGA ---');
  console.log(`Duração Total: ${totalDuration}ms`);
  console.log(`Iterações: ${iterations}`);
  console.log(`Sucesso: ${results.success}`);
  console.log(`Erros: ${results.error} (${((results.error / iterations) * 100).toFixed(2)}%)`);
  console.log(`Latência Média: ${avgLatency.toFixed(2)}ms`);
  console.log(`Latência P95: ${p95Latency.toFixed(2)}ms`);
  console.log(`Vazão: ${(iterations / (totalDuration / 1000)).toFixed(2)} req/s`);
  console.log('---------------------------------------\n');
}

// Para rodar no sandbox use: bun run load-test.ts
runLoadTest(50).catch(console.error);
