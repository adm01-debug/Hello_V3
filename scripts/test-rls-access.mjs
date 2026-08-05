import { Client } from 'pg';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTR9.YvMKFvpz0kH-GPMgi-oEUrt0ZCqICuY7AAcoEt8Cpolc';

// Teste via cliente postgres direto simulando o que o frontend faz via Supabase JS client
const client = new Client({
  host: 'db.cfmlmcdyjuotqobjapng.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'NuvBjdU1gazbMYHr',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function main() {
  try {
    await client.connect();

    console.log('=== TESTANDO ACESSO VIA SERVICE_ROLE (igual ao backend) ===\n');

    // Verifica se RLS está mesmo bloqueando - simula um SELECT como se fosse o usuário 'ti'
    const queries = [
      { name: 'contacts', sql: 'SELECT id, name FROM public.contacts LIMIT 5' },
      { name: 'deals', sql: 'SELECT id, title FROM public.deals LIMIT 5' },
      { name: 'agents', sql: 'SELECT id, name FROM public.agents LIMIT 5' },
      { name: 'call_sessions', sql: 'SELECT id FROM public.call_sessions LIMIT 5' },
      { name: 'user_profiles (admin)', sql: 'SELECT id, email, role FROM public.user_profiles LIMIT 5' },
    ];

    for (const q of queries) {
      try {
        const r = await client.query(q.sql);
        console.log(`OK ${q.name}: ${r.rows.length} rows`);
        if (r.rows.length > 0) console.log(`   ex: ${JSON.stringify(r.rows[0])}`);
      } catch (err) {
        console.log(`ERRO ${q.name}: ${err.message}`);
      }
    }

    console.log('\n=== TESTANDO RLS SIMULANDO USER ti ===\n');
    await client.query(`
      SET LOCAL role authenticated;
      SET LOCAL request.jwt.claims TO '{"sub":"7c353029-0585-46b3-8a0b-f8f3fb3a578a","email":"ti@promobrindes.com.br","role":"authenticated"}';
    `).catch(e => console.log('SET role falhou (esperado se nao for superuser):', e.message));

    for (const q of queries) {
      try {
        const r = await client.query(q.sql);
        console.log(`RLS ${q.name}: ${r.rows.length} rows`);
      } catch (err) {
        console.log(`RLS ${q.name} ERRO: ${err.message}`);
      }
    }

    console.log('\n=== POLICIES RLS DETALHADAS ===\n');
    const policies = await client.query(`
      SELECT tablename, policyname, cmd, permissive, qual::text, with_check::text
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('contacts', 'deals', 'agents', 'call_sessions', 'user_profiles', 'user_roles')
      ORDER BY tablename, cmd
    `);
    for (const row of policies.rows) {
      console.log(`--- ${row.tablename} | ${row.cmd} | ${row.policyname}`);
      console.log(`   USING: ${row.qual}`);
      console.log(`   CHECK: ${row.with_check}`);
    }

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await client.end();
  }
}

main();