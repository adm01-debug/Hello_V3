import { readFileSync } from 'fs';
import { Client } from 'pg';

const sql = readFileSync('d:\\Projetos\\hello-v3-main\\scripts\\fix-get-call-volume-stats.sql', 'utf8');

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