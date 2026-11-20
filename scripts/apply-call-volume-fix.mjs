import { readFileSync } from 'fs';
import { Client } from 'pg';

const sql = readFileSync('d:\\Projetos\\hello-v3-main\\scripts\\fix-get-call-volume-stats.sql', 'utf8');

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
    console.log('Aplicando fix em get_call_volume_stats...\n');
    await client.query(sql);
    console.log('✓ Função recriada com sucesso');

    // Testa direto
    const r = await client.query('SELECT public.get_call_volume_stats() as result');
    console.log('\nResultado:');
    console.log(JSON.stringify(r.rows[0].result, null, 2).slice(0, 800));
  } catch (err) {
    console.error('ERRO:', err.message);
    if (err.code) console.error('Codigo:', err.code);
    if (err.detail) console.error('Detalhe:', err.detail);
  } finally {
    await client.end();
  }
}

main();