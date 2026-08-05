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

    console.log('=== LIMPEZA: removendo user teste signup ===\n');

    // Lista de tabelas principais e contagens REAIS
    const stats = await client.query(`
      SELECT
        (SELECT count(*) FROM contacts) as contacts,
        (SELECT count(*) FROM deals) as deals,
        (SELECT count(*) FROM agents) as agents,
        (SELECT count(*) FROM call_sessions) as call_sessions,
        (SELECT count(*) FROM contact_interactions) as contact_interactions,
        (SELECT count(*) FROM performance_metrics) as performance_metrics,
        (SELECT count(*) FROM audit_logs) as audit_logs,
        (SELECT count(*) FROM user_profiles) as user_profiles,
        (SELECT count(*) FROM user_roles) as user_roles,
        (SELECT count(*) FROM auth.users) as auth_users,
        (SELECT count(*) FROM auth.identities) as auth_identities,
        (SELECT count(*) FROM webhook_flush_metrics) as webhook_flush_metrics,
        (SELECT count(*) FROM voip_trunk_health_checks) as voip_trunk_health_checks
    `);

    console.log('=== CONTAGEM FINAL DAS TABELAS ===\n');
    const r = stats.rows[0];
    for (const [k, v] of Object.entries(r)) {
      console.log(`  ${k}: ${v}`);
    }

    // Ver usuários auth
    console.log('\n=== AUTH USERS ===\n');
    const users = await client.query(`SELECT id, email, created_at, email_confirmed_at FROM auth.users ORDER BY created_at`);
    for (const u of users.rows) {
      console.log(`  ${u.email} | confirmado: ${u.email_confirmed_at ? 'sim' : 'nao'} | ${u.created_at}`);
    }

    // Remover user de teste que criei
    console.log('\n=== REMOVENDO USER DE TESTE ===\n');
    const deleted = await client.query(`
      DELETE FROM auth.users WHERE email LIKE 'test%@gmail.com'
      RETURNING id, email
    `);
    console.log(`Removidos: ${deleted.rowCount} users`);
    for (const u of deleted.rows) console.log(`  ${u.email}`);

    // Cascade delete identities
    const idents = await client.query(`
      DELETE FROM auth.identities WHERE user_id NOT IN (SELECT id FROM auth.users)
      RETURNING id
    `);
    console.log(`Identidades órfãs removidas: ${idents.rowCount}`);

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await client.end();
  }
}

main();