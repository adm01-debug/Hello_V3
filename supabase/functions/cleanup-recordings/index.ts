// Retencao das gravacoes de chamada (item C2 de docs/audits/pendencias-2026-07.md).
//
// Ate aqui nada apagava nada: `database-cleanup` limpa 5 tabelas de seguranca e
// nao toca storage, e o bucket `call-recordings` cresceria sem limite. A regra
// de negocio e 180 dias.
//
// Dois caminhos de autenticacao, igual as outras edges de cron:
//   - pg_cron / chamada interna: Bearer <RECORDINGS_CRON_TOKEN>
//   - manual: JWT de usuario com role admin

import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { mesmaString } from '../_shared/constant-time.ts';

const RETENCAO_DIAS = 180;
const BATCH = 100;

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  const json = (payload: unknown, status: number) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const cronToken = Deno.env.get('RECORDINGS_CRON_TOKEN');
    const veioDoCron = !!cronToken && mesmaString(authHeader, `Bearer ${cronToken}`);

    if (!veioDoCron) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
        authHeader.replace('Bearer ', ''),
      );
      if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);

      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: profile } = await admin
        .from('user_profiles')
        .select('role')
        .eq('id', claims.claims.sub)
        .maybeSingle();
      if (!profile || profile.role !== 'admin') return json({ error: 'Forbidden: admin only' }, 403);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const corte = new Date(Date.now() - RETENCAO_DIAS * 24 * 3600 * 1000).toISOString();

    // Seleciona os registros vencidos. `recorded_at` e a data da chamada;
    // `created_at` cobre linhas antigas em que a coluna veio nula.
    const { data: vencidos, error: selErr } = await admin
      .from('call_recordings')
      .select('id, file_path')
      .or(`recorded_at.lt.${corte},and(recorded_at.is.null,created_at.lt.${corte})`)
      .limit(BATCH);

    if (selErr) return json({ error: selErr.message }, 500);

    const registros = vencidos ?? [];
    const caminhos = registros.map((r) => r.file_path).filter((p): p is string => !!p);

    let objetosRemovidos = 0;
    if (caminhos.length > 0) {
      const { data: removidos, error: rmErr } = await admin.storage
        .from('call-recordings')
        .remove(caminhos);
      if (rmErr) {
        // Nao apaga a linha se o objeto continua no bucket: senao o arquivo
        // fica orfao e para sempre invisivel.
        return json({ error: `storage: ${rmErr.message}`, linhas_preservadas: registros.length }, 500);
      }
      objetosRemovidos = removidos?.length ?? 0;
    }

    const ids = registros.map((r) => r.id);
    let linhasRemovidas = 0;
    if (ids.length > 0) {
      const { data: del, error: delErr } = await admin
        .from('call_recordings')
        .delete()
        .in('id', ids)
        .select('id');
      if (delErr) return json({ error: delErr.message }, 500);
      linhasRemovidas = del?.length ?? 0;
    }

    return json(
      {
        retencao_dias: RETENCAO_DIAS,
        corte,
        linhas_removidas: linhasRemovidas,
        objetos_removidos: objetosRemovidos,
        restantes_no_lote: registros.length === BATCH,
      },
      200,
    );
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
