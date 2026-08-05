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

    console.log('=== HOLD_EVENTS ===\n');
    const he = await client.query(`
      SELECT id, call_session_id, started_at, ended_at,
             COALESCE(ended_at, now()) - started_at as duration,
             CASE WHEN ended_at IS NULL THEN 'ORFAO' ELSE 'OK' END as status
      FROM hold_events
      ORDER BY started_at DESC
      LIMIT 10
    `);
    for (const r of he.rows) {
      console.log(`  ${r.id} | session=${r.call_session_id?.slice(0,8) ?? 'null'} | dur=${r.duration} | status=${r.status}`);
    }

    console.log('\n=== CALL_SESSIONS com status que indicam hold ===\n');
    const cs = await client.query(`
      SELECT id, agent_name, started_at, ended_at, status, hold_time_seconds, hold_count
      FROM call_sessions
      WHERE hold_count > 0 OR status IN ('on_hold', 'in_progress')
      ORDER BY started_at DESC
      LIMIT 10
    `);
    for (const r of cs.rows) {
      console.log(`  ${r.id.slice(0,8)} | agent=${r.agent_name} | status=${r.status} | hold_count=${r.hold_count} | hold_time=${r.hold_time_seconds}s | ended_at=${r.ended_at}`);
    }

    console.log('\n=== Tabela hold_events schema ===\n');
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable FROM information_schema.columns
      WHERE table_schema='public' AND table_name='hold_events'
      ORDER BY ordinal_position
    `);
    for (const c of cols.rows) console.log(`  ${c.column_name}: ${c.data_type}`);

    // Cleanup: deleta hold_events que não tem fim há mais de 1h
    console.log('\n=== LIMPEZA: deletando hold_events orfaos (>1h sem ended_at) ===\n');
    const del = await client.query(`
      DELETE FROM hold_events
      WHERE ended_at IS NULL AND started_at < now() - interval '1 hour'
      RETURNING id, call_session_id, started_at
    `);
    console.log(`Removidos: ${del.rowCount} hold_events orfaos`);
    for (const r of del.rows) console.log(`  ${r.id}`);

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await client.end();
  }
}

main();