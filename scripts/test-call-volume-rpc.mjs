const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_ANON_KEY no ambiente.'); })();
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente.'); })();

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