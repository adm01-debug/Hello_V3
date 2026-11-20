// Test validate-ip com JWT válido de usuário autenticado
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_ANON_KEY no ambiente.'); })();

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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente.'); })();

const tables = ['user_ip_restrictions', 'ip_whitelist', 'user_allowed_ips', 'blocked_access_logs'];
for (const t of tables) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=0`, {
    method: 'HEAD',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  console.log(`  ${t}: ${r.status} ${r.headers.get('content-range') || '(vazia ou erro)'}`);
}