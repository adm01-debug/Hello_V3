// Testa exatamente as chamadas que o frontend faz via supabase-js client
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_ANON_KEY no ambiente.'); })();
const _SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente.'); })();

const tests = [
  // 1. SELECT como ANON (sem login) - geralmente bloqueado por RLS
  { name: 'GET /contacts (anon, sem auth header)', url: `${SUPABASE_URL}/rest/v1/contacts?select=*&limit=3`, headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
  // 2. Tabela deals - provavelmente tem coluna diferente
  { name: 'GET /deals?select=* (anon)', url: `${SUPABASE_URL}/rest/v1/deals?select=*&limit=3`, headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
  // 3. Verifica schema de deals
  { name: 'OPTIONS /deals (preflight)', url: `${SUPABASE_URL}/rest/v1/deals?limit=0`, headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
  // 4. Tabela agents
  { name: 'GET /agents?select=* (anon)', url: `${SUPABASE_URL}/rest/v1/agents?select=*&limit=3`, headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
  // 5. Tabela call_sessions
  { name: 'GET /call_sessions?select=* (anon)', url: `${SUPABASE_URL}/rest/v1/call_sessions?select=*&limit=3`, headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
];

for (const t of tests) {
  try {
    const res = await fetch(t.url, { method: 'GET', headers: t.headers });
    const text = await res.text();
    let body = text;
    try { body = JSON.stringify(JSON.parse(text), null, 2).slice(0, 500); } catch { /* corpo nao e JSON */ }
    console.log(`\n=== ${t.name} ===`);
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${body}`);
  } catch (err) {
    console.log(`\n=== ${t.name} === ERRO: ${err.message}`);
  }
}