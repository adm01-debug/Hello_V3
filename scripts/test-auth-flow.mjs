// Simula login real do ti@promobrindes e testa queries do frontend
const SUPABASE_URL = 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTQsImV4cCI6MjEwMDQ4NTQxNH0.3vn9Pm5G3kKPKJrDAjUVgh5gXhYgawgKiM3bFstFEAk';

console.log('=== ETAPA 1: LOGIN ti@promobrindes ===\n');

const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
  },
  body: JSON.stringify({
    email: 'ti@promobrindes.com.br',
    password: process.env.TI_PASSWORD || 'SenhaErrada',
  }),
});

console.log(`Login status: ${loginRes.status}`);
const loginBody = await loginRes.text();
console.log(`Login body: ${loginBody.slice(0, 500)}`);

if (loginRes.status !== 200) {
  console.log('\nNÃO FOI POSSÍVEL LOGIN. Vou testar com queries autenticadas via JWT manual.\n');
}

// Tentar com token manual (user_id + role embutido no JWT)
const { importPKCS8, SignJWT } = await import('jose');

console.log('\n=== ETAPA 2: Verificar com service_role que dados existem ===\n');

// Testa as tabelas críticas que o frontend consulta
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkwOTQxNCwiZXhwIjoyMTAwNDg1NDE0fQ.tsZep2JvIS4GPMgi-oEUrt0ZCqICuY7AAcoEt8Cpolc';

const queries = [
  { name: 'contacts (count)', url: `${SUPABASE_URL}/rest/v1/contacts?select=id&limit=0`, count: true },
  { name: 'deals (count)', url: `${SUPABASE_URL}/rest/v1/deals?select=id&limit=0`, count: true },
  { name: 'agents (count)', url: `${SUPABASE_URL}/rest/v1/agents?select=id&limit=0`, count: true },
  { name: 'call_sessions (count)', url: `${SUPABASE_URL}/rest/v1/call_sessions?select=id&limit=0`, count: true },
  { name: 'performance_metrics (count)', url: `${SUPABASE_URL}/rest/v1/performance_metrics?select=id&limit=0`, count: true },
  { name: 'voip_trunk_health_checks (count)', url: `${SUPABASE_URL}/rest/v1/voip_trunk_health_checks?select=reachable&limit=10`, count: false },
  { name: 'webhook_flush_metrics (count)', url: `${SUPABASE_URL}/rest/v1/webhook_flush_metrics?select=sent&limit=10`, count: false },
];

for (const q of queries) {
  try {
    const res = await fetch(q.url, {
      method: 'HEAD',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const range = res.headers.get('content-range') || '(sem header)';
    console.log(`  ${q.name}: ${res.status} | ${range}`);
  } catch (err) {
    console.log(`  ${q.name}: ERRO ${err.message}`);
  }
}

console.log('\n=== ETAPA 3: Tentar as queries EXATAS que useNetworkMonitor faz ===\n');

// GET para health-check
const hcRes = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, {
  method: 'GET',
  headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, Origin: 'http://localhost:8081' },
});
console.log(`health-check: ${hcRes.status} | CORS: ${hcRes.headers.get('access-control-allow-origin')}`);
console.log(await hcRes.text());