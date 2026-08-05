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
    console.log('CONECTADO!\n');

    const version = await client.query('SELECT version()');
    console.log('Versao:', version.rows[0].version);

    // Listar schemas
    const schemas = await client.query(`
      SELECT table_schema as schema_name, COUNT(*) as tables
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY table_schema
      ORDER BY table_schema
    `);
    console.log('\n=== SCHEMAS ===');
    for (const row of schemas.rows) {
      console.log(`  ${row.schema_name}: ${row.tables} tabelas`);
    }

    // Listar tabelas public
    const tables = await client.query(`
      SELECT table_name,
             (xpath('/row/cnt/text()', xml_count))[1]::text::int as est_rows
      FROM (
        SELECT table_name,
               query_to_xml(format('SELECT count(*) AS cnt FROM %I.%I', table_schema, table_name), false, true, '') as xml_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      ) t
      LIMIT 200
    `);
    console.log('\n=== TABELAS PUBLIC ===');
    for (const row of tables.rows) {
      console.log(`  ${row.table_name}: ${row.est_rows} linhas`);
    }

    // Auth users
    try {
      const users = await client.query('SELECT id, email, created_at FROM auth.users LIMIT 10');
      console.log('\n=== AUTH USERS ===');
      for (const row of users.rows) {
        console.log(`  ${row.email} (${row.id}) - criado em ${row.created_at}`);
      }
    } catch (e) {
      console.log('\n=== AUTH USERS: erro -', e.message);
    }

    // Storage buckets
    try {
      const buckets = await client.query('SELECT id, public, created_at FROM storage.buckets');
      console.log('\n=== STORAGE BUCKETS ===');
      if (buckets.rows.length === 0) console.log('  (nenhum)');
      for (const row of buckets.rows) {
        console.log(`  ${row.id} (public=${row.public})`);
      }
    } catch (e) {
      console.log('\n=== STORAGE BUCKETS: erro -', e.message);
    }

    // Extensões instaladas
    const exts = await client.query(`SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql') ORDER BY extname`);
    console.log('\n=== EXTENSOES ===');
    console.log(' ', exts.rows.map(r => r.extname).join(', '));

    // RLS habilitado?
    const rls = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = false
      ORDER BY tablename
      LIMIT 10
    `);
    console.log('\n=== TABELAS SEM RLS (primeiras 10) ===');
    if (rls.rows.length === 0) console.log('  Todas com RLS habilitado!');
    for (const row of rls.rows) {
      console.log(`  ${row.schemaname}.${row.tablename}: rls=${row.rowsecurity}`);
    }

  } catch (err) {
    console.error('ERRO:', err.message);
    if (err.code) console.error('Codigo:', err.code);
    if (err.detail) console.error('Detalhe:', err.detail);
  } finally {
    await client.end();
  }
}

main();