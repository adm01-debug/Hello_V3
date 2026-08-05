// Test validate-ip com JWT válido de usuário autenticado
const SUPABASE_URL = 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTQsImV4cCI6MjEwMDQ4NTQxNH0.3vn9Pm5G3kKPKJrDAjUVgh5gXhYgawgKiM3bFstFEAk';

// 1. Tentar gerar magic link ou token anônimo de admin
// Usar /auth/v1/admin/generate_link é restrito, então vamos simular via signup de um user novo

console.log('=== TEST 1: Signup de usuário de teste ===\n');
const ts = Date.now();
const testEmail = `test${ts}@gmail.com`;
const testPass = 'Test123!@#';

const signup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
  body: JSON.stringify({ email: testEmail, password: testPass }),
});

console.log(`Signup status: ${signup.status}`);
const signupBody = await signup.json();
console.log(`Signup body: ${JSON.stringify(signupBody).slice(0, 400)}`);

if (signupBody?.access_token) {
  const userToken = signupBody.access_token;

  console.log('\n=== TEST 2: validate-ip com JWT válido ===\n');
  const vi = await fetch(`${SUPABASE_URL}/functions/v1/validate-ip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({}),
  });
  console.log(`Status: ${vi.status}`);
  console.log(`Body: ${await vi.text()}`);
}

// 3. Verificar tabelas de whitelist existem
console.log('\n=== TEST 3: Verificar tabelas whitelist no schema ===\n');
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkwOTQxNCwiZXhwIjoyMTAwNDg1NDE0fQ.tsZep2JvIS4GPMgi-oEUrt0ZCqICuY7AAcoEt8Cpolc';

const tables = ['user_ip_restrictions', 'ip_whitelist', 'user_allowed_ips', 'blocked_access_logs'];
for (const t of tables) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=0`, {
    method: 'HEAD',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  console.log(`  ${t}: ${r.status} ${r.headers.get('content-range') || '(vazia ou erro)'}`);
}