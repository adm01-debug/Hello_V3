const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://cfmlmcdyjuotqobjapng.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_ANON_KEY no ambiente.'); })();
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? (() => { throw new Error('Credencial ausente: defina SUPABASE_SERVICE_ROLE_KEY no ambiente.'); })();

const rpcs = [
  'get_dashboard_stats',
  'get_agents_with_active_calls',
  'get_call_volume_stats',
  'get_queue_stats',
];

console.log('=== TESTANDO RPCs DO DASHBOARD ===\n');

for (const fn of rpcs) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({}),
    });
    const text = await r.text();
    console.log(`--- ${fn} ---`);
    console.log(`Status: ${r.status}`);
    console.log(`Body: ${text.slice(0, 400)}${text.length > 400 ? '...' : ''}\n`);
  } catch (err) {
    console.log(`--- ${fn} --- ERRO: ${err.message}\n`);
  }
}