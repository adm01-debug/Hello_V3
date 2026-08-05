import { Client } from 'pg';

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
    console.log('Verificando policies RLS e dados visiveis via anon...\n');

    // 1. Verificar policies
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
      LIMIT 50
    `);
    console.log('=== POLICIES (primeiras 50) ===');
    if (policies.rows.length === 0) console.log('  Nenhuma policy encontrada!');
    for (const row of policies.rows) {
      console.log(`  ${row.tablename} | ${row.cmd} | ${row.policyname} | roles=${row.roles}`);
    }

    // 2. Auth config - signup habilitado?
    const signup = await client.query(`
      SELECT value FROM auth.config WHERE parameter = 'SITE_URL' OR parameter = 'DISABLE_SIGNUP'
    `).catch(() => ({ rows: [] }));
    console.log('\n=== AUTH CONFIG ===');
    console.log(signup.rows.length ? signup.rows : 'N/A (acesso restrito)');

    // 3. Verificar grants para anon e authenticated
    const grants = await client.query(`
      SELECT grantee, table_name, privilege_type
      FROM information_schema.table_privileges
      WHERE table_schema = 'public'
        AND table_name IN ('contacts', 'deals', 'agents', 'call_sessions', 'user_profiles', 'user_roles')
        AND grantee IN ('anon', 'authenticated')
      ORDER BY table_name, grantee, privilege_type
    `);
    console.log('\n=== GRANTS EM TABELAS-CHAVE ===');
    for (const row of grants.rows) {
      console.log(`  ${row.table_name} | ${row.grantee} | ${row.privilege_type}`);
    }

    // 4. Conferir dados do usuário logado (ti@promobrindes.com.br)
    const tiUser = await client.query(`SELECT id FROM auth.users WHERE email = 'ti@promobrindes.com.br'`);
    console.log('\n=== USER ti@promobrindes ===');
    console.log('  ID:', tiUser.rows[0]?.id);

    if (tiUser.rows.length > 0) {
      const userId = tiUser.rows[0].id;
      const profile = await client.query(`SELECT * FROM public.user_profiles WHERE id = $1`, [userId]);
      console.log('  Profile:', profile.rows[0]);

      const roles = await client.query(`SELECT * FROM public.user_roles WHERE user_id = $1`, [userId]);
      console.log('  Roles:', roles.rows);

      // Verificar policies para o user
      const contactsCount = await client.query(`
        SELECT COUNT(*) as total FROM public.contacts
      `);
      console.log(`  contacts (via service_role): ${contactsCount.rows[0].total}`);
    }

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await client.end();
  }
}

main();