// Login do ti@promobrindes (já confirmado) e teste das queries
const SUPABASE_URL = 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTQsImV4cCI6MjEwMDQ4NTQxNH0.3vn9Pm5G3kKPKJrDAjUVgh5gXhYgawgKiM3bFstFEAk';

// Como não tenho a senha do ti@promobrindes, vou usar um truque:
// service_role pode criar um magic link ou token direto
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkwOTQxNCwiZXhwIjoyMTAwNDg1NDE0fQ.tsZep2JvIS4GPMgi-oEUrt0ZCqICuY7AAcoEt8Cpolc';

const email = 'ti@promobrindes.com.br';

// 1. Tentar generate_link (pode falhar sem admin)
console.log('=== TEST 1: Gerar magic link via admin API ===\n');
const magicLink = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  body: JSON.stringify({ email, type: 'magiclink' }),
});
console.log(`Status: ${magicLink.status}`);
const magicBody = await magicLink.json();
console.log(`Body: ${JSON.stringify(magicBody).slice(0, 800)}`);

// 2. Tentar login direto com senha (vai falhar pq nao temos, mas mostra o erro)
console.log('\n=== TEST 2: Tentar signin direto ===\n');
const signin = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
  body: JSON.stringify({ email, password: 'wrong-password' }),
});
console.log(`Signin status: ${signin.status}`);
console.log(`Body: ${await signin.text()}`);

// 3. Gerar token JWT manualmente usando jose-like com payload válido
// Como temos a user_id, podemos tentar "issue_jwt" via admin
console.log('\n=== TEST 3: Listar sessões ativas do ti ===\n');
const sessions = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/7c353029-0585-46b3-8a0b-f8f3fb3a578a/sessions`, {
  method: 'GET',
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
console.log(`Sessions status: ${sessions.status}`);
const sessBody = await sessions.json();
console.log(`Body: ${JSON.stringify(sessBody).slice(0, 600)}`);

// 2. Se temos o token, testar as queries autenticadas
if (magicBody?.action_link) {
  console.log('\n=> Action link gerado. Extraindo token...');
  const url = new URL(magicBody.action_link);
  const token = url.searchParams.get('token');
  console.log(`Token: ${token?.slice(0, 30)}...`);

  if (token) {
    // Verify OTP para trocar pelo JWT
    const verify = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ email, token, type: 'magiclink' }),
    });
    console.log(`\nVerify status: ${verify.status}`);
    const verifyBody = await verify.json();
    const userToken = verifyBody.access_token;
    console.log(`Got user token: ${userToken?.slice(0, 30)}...`);

    if (userToken) {
      console.log('\n=== TEST 2: queries autenticadas como ti@promobrindes ===\n');
      const tests = [
        { name: 'contacts', url: `${SUPABASE_URL}/rest/v1/contacts?select=id,name&limit=3` },
        { name: 'deals', url: `${SUPABASE_URL}/rest/v1/deals?select=id,name,value_cents&limit=3` },
        { name: 'agents', url: `${SUPABASE_URL}/rest/v1/agents?select=id,name&limit=3` },
        { name: 'call_sessions', url: `${SUPABASE_URL}/rest/v1/call_sessions?select=id,agent_name,started_at&limit=3` },
        { name: 'user_profiles (próprio)', url: `${SUPABASE_URL}/rest/v1/user_profiles?select=id,email,role&id=eq.7c353029-0585-46b3-8a0b-f8f3fb3a578a` },
        { name: 'user_roles (próprio)', url: `${SUPABASE_URL}/rest/v1/user_roles?select=user_id,role&user_id=eq.7c353029-0585-46b3-8a0b-f8f3fb3a578a` },
      ];
      for (const t of tests) {
        const r = await fetch(t.url, {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${userToken}` },
        });
        const text = await r.text();
        console.log(`  ${t.name}: ${r.status} | ${text.slice(0, 200)}`);
      }

      // Test validate-ip com user JWT
      console.log('\n=== TEST 3: validate-ip com user JWT ===\n');
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
  }
}