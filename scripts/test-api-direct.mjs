// Testa exatamente as chamadas que o frontend faz via supabase-js client
const SUPABASE_URL = 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTQsImV4cCI6MjEwMDQ4NTQxNH0.3vn9Pm5G3kKPKJrDAjUVgh5gXhYgawgKiM3bFstFEAk';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkwOTQxNCwiZXhwIjoyMTAwNDg1NDE0fQ.tsZep2JvIS4GPMgi-oEUrt0ZCqICuY7AAcoEt8Cpolc';

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
    try { body = JSON.stringify(JSON.parse(text), null, 2).slice(0, 500); } catch {}
    console.log(`\n=== ${t.name} ===`);
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${body}`);
  } catch (err) {
    console.log(`\n=== ${t.name} === ERRO: ${err.message}`);
  }
}