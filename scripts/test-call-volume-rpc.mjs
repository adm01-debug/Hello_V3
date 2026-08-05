const SUPABASE_URL = 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTQsImV4cCI6MjEwMDQ4NTQxNH0.3vn9Pm5G3kKPKJrDAjUVgh5gXhYgawgKiM3bFstFEAk';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkwOTQxNCwiZXhwIjoyMTAwNDg1NDE0fQ.tsZep2JvIS4GPMgi-oEUrt0ZCqICuY7AAcoEt8Cpolc';

console.log('=== TEST: get_call_volume_stats ===\n');

// 1. Service role (bypassa RLS)
const r1 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_call_volume_stats`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  body: JSON.stringify({}),
});
console.log(`Service role: ${r1.status}`);
const text1 = await r1.text();
console.log(`Body: ${text1.slice(0, 500)}`);

// 2. Anon (deve falhar - sem grant)
const r2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_call_volume_stats`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  body: JSON.stringify({}),
});
console.log(`\nAnon: ${r2.status}`);
console.log(`Body: ${await r2.text()}`);

// 3. Ver dados em call_sessions
console.log('\n=== Dados call_sessions ===\n');
const r3 = await fetch(`${SUPABASE_URL}/rest/v1/call_sessions?select=id,direction,started_at&limit=10`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
console.log(`Status: ${r3.status}`);
const data = await r3.json();
console.log(`Total retornado: ${Array.isArray(data) ? data.length : 'N/A'}`);
if (Array.isArray(data) && data.length > 0) {
  console.log('Sample:', JSON.stringify(data.slice(0, 3)));
}

// 4. Verifica grants da função
console.log('\n=== Grants da função ===\n');
// Não tem como fazer via REST, mas vejo se a função existe
const r4 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_call_volume_stats`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  body: JSON.stringify({}),
});
console.log(`Anon status: ${r4.status}`);
console.log(`Anon body: ${await r4.text()}`);