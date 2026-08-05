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

    // 1. Ver schema das tabelas chave
    const tables = ['contacts', 'deals', 'agents', 'call_sessions', 'performance_metrics', 'webhook_flush_metrics', 'user_profiles', 'user_roles'];
    for (const t of tables) {
      const cols = await client.query(`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1
        ORDER BY ordinal_position
      `, [t]);
      console.log(`\n=== ${t} ===`);
      for (const c of cols.rows) console.log(`  ${c.column_name}: ${c.data_type}`);
    }

    // 2. Total de linhas em TODAS as tabelas públicas
    console.log('\n=== TOTAL DE LINHAS POR TABELA ===');
    const counts = await client.query(`
      SELECT relname, n_live_tup
      FROM pg_stat_user_tables
      WHERE schemaname='public' AND n_live_tup > 0
      ORDER BY n_live_tup DESC
      LIMIT 30
    `);
    for (const r of counts.rows) console.log(`  ${r.relname}: ${r.n_live_tup}`);

    // 3. Listar TODAS tabelas públicas (não importa se tem dados)
    console.log('\n=== TODAS AS TABELAS PUBLIC ===');
    const allTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' ORDER BY table_name
    `);
    console.log(`Total: ${allTables.rows.length} tabelas`);

    // 4. Funções helper RLS
    console.log('\n=== FUNÇÕES HELPER RLS ===');
    const funcs = await client.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema='public' AND routine_name LIKE 'is_%' OR routine_name LIKE 'has_%' OR routine_name LIKE 'get_%' OR routine_name='is_admin_user'
      ORDER BY routine_name
    `);
    for (const r of funcs.rows) console.log(`  ${r.routine_name}`);

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await client.end();
  }
}

main();