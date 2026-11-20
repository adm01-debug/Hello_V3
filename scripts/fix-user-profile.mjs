import { Client } from 'pg';

const clientConfig = (() => {
  if (process.env.SUPABASE_DB_URL) return { connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 };
  const password = process.env.DB_PASSWORD;
  if (!password) throw new Error('Credencial ausente: defina SUPABASE_DB_URL ou DB_PASSWORD no ambiente.');
  return {
    host: process.env.DB_HOST ?? 'db.cfmlmcdyjuotqobjapng.supabase.co',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'postgres',
    user: process.env.DB_USER ?? 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  };
})();

const client = new Client(clientConfig);

async function main() {
  try {
    await client.connect();
    console.log('Criando profile e role para ti@promobrindes...\n');

    const userId = '7c353029-0585-46b3-8a0b-f8f3fb3a578a';

    // 1. Ver schema de user_profiles
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);
    console.log('=== user_profiles SCHEMA ===');
    for (const c of cols.rows) console.log(`  ${c.column_name}: ${c.data_type} (nullable=${c.is_nullable}, default=${c.column_default})`);

    const roleCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_roles'
      ORDER BY ordinal_position
    `);
    console.log('\n=== user_roles SCHEMA ===');
    for (const c of roleCols.rows) console.log(`  ${c.column_name}: ${c.data_type} (nullable=${c.is_nullable}, default=${c.column_default})`);

    // 2. Criar profile com role admin inline
    console.log('\n=== Criando/atualizando user_profile ===');
    const profileInsert = await client.query(`
      INSERT INTO public.user_profiles (id, email, full_name, role, created_at, updated_at)
      VALUES ($1, $2, $3, 'admin', now(), now())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'admin',
        updated_at = now()
      RETURNING id, email, role, full_name
    `, [userId, 'ti@promobrindes.com.br', 'TI - Administrador']);
    console.log('  Profile:', profileInsert.rows[0]);

    // 3. Criar role na tabela user_roles
    console.log('\n=== Criando user_role ===');
    const roleInsert = await client.query(`
      INSERT INTO public.user_roles (user_id, role, is_active, granted_at, created_at, updated_at)
      VALUES ($1, 'admin'::app_role, true, now(), now(), now())
      ON CONFLICT DO NOTHING
      RETURNING user_id, role
    `, [userId]);
    console.log('  Role:', roleInsert.rows[0] ?? '(ja existia ou conflito)');

    // 4. Verificar
    const checkProfile = await client.query(`SELECT * FROM public.user_profiles WHERE id = $1`, [userId]);
    const checkRoles = await client.query(`SELECT * FROM public.user_roles WHERE user_id = $1`, [userId]);

    console.log('\n=== VERIFICACAO FINAL ===');
    console.log('  Profile:', checkProfile.rows[0] ?? '(vazio)');
    console.log('  Roles:', checkRoles.rows);

  } catch (err) {
    console.error('ERRO:', err.message);
    if (err.code) console.error('Codigo:', err.code);
    if (err.detail) console.error('Detalhe:', err.detail);
  } finally {
    await client.end();
  }
}

main();