const SUPABASE_URL = 'https://cfmlmcdyjuotqobjapng.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkwOTQxNCwiZXhwIjoyMTAwNDg1NDE0fQ.tsZep2JvIS4GPMgi-oEUrt0ZCqICuY7AAcoEt8Cpolc';

const queries = [
  { name: 'contacts', url: `${SUPABASE_URL}/rest/v1/contacts?select=id&limit=0`, expectMin: 1 },
  { name: 'deals', url: `${SUPABASE_URL}/rest/v1/deals?select=id&limit=0`, expectMin: 1 },
  { name: 'agents', url: `${SUPABASE_URL}/rest/v1/agents?select=id&limit=0`, expectMin: 1 },
  { name: 'call_sessions', url: `${SUPABASE_URL}/rest/v1/call_sessions?select=id&limit=0`, expectMin: 1 },
  { name: 'performance_metrics', url: `${SUPABASE_URL}/rest/v1/performance_metrics?select=id&limit=0`, expectMin: 1 },
  { name: 'contact_interactions', url: `${SUPABASE_URL}/rest/v1/contact_interactions?select=id&limit=0`, expectMin: 0 },
  { name: 'voip_trunk_health_checks', url: `${SUPABASE_URL}/rest/v1/voip_trunk_health_checks?select=id&limit=0`, expectMin: 0 },
  { name: 'webhook_flush_metrics', url: `${SUPABASE_URL}/rest/v1/webhook_flush_metrics?select=id&limit=0`, expectMin: 0 },
  { name: 'queue_metrics', url: `${SUPABASE_URL}/rest/v1/queue_metrics?select=id&limit=0`, expectMin: 0 },
  { name: 'user_profiles', url: `${SUPABASE_URL}/rest/v1/user_profiles?select=id&limit=0`, expectMin: 1 },
  { name: 'user_roles', url: `${SUPABASE_URL}/rest/v1/user_roles?select=id&limit=0`, expectMin: 1 },
];

console.log('=== TABELAS CHAVE - SERVICE_ROLE BYPASS RLS ===\n');

for (const q of queries) {
  try {
    const res = await fetch(q.url, {
      method: 'HEAD',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const range = res.headers.get('content-range') || '(sem header)';
    const totalMatch = range.match(/\/(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    const status = total === 0 && q.expectMin > 0 ? '⚠️ VAZIA' : '✓';
    console.log(`  ${status} ${q.name.padEnd(28)} status=${res.status} count=${total}`);
  } catch (err) {
    console.log(`  ✗ ${q.name.padEnd(28)} ERRO: ${err.message}`);
  }
}

// Testa a query EXATA que health-check faz
console.log('\n=== QUERIES DO health-check (service_role) ===\n');
const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

const trunks = await fetch(`${SUPABASE_URL}/rest/v1/voip_trunk_health_checks?select=reachable,latency_ms&checked_at=gte.${since}`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
console.log('voip_trunk_health_checks (15min):', trunks.status, (await trunks.text()).slice(0, 200));

const webhooks = await fetch(`${SUPABASE_URL}/rest/v1/webhook_flush_metrics?select=sent,failed,latency_ms_avg&created_at=gte.${since}`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
console.log('webhook_flush_metrics (15min):', webhooks.status, (await webhooks.text()).slice(0, 200));

// Edge function health-check invocada como service_role
console.log('\n=== EDGE FUNCTION health-check ===\n');
const hc = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, {
  method: 'GET',
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
console.log(`Status: ${hc.status}`);
console.log(`Body: ${await hc.text()}`);

// Edge function validate-ip
console.log('\n=== EDGE FUNCTION validate-ip ===\n');
const vi = await fetch(`${SUPABASE_URL}/functions/v1/validate-ip`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ip: '8.8.8.8' }),
});
console.log(`Status: ${vi.status}`);
console.log(`Body: ${await vi.text()}`);