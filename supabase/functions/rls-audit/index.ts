// RLS Audit — Relatorio de RLS nas tabelas criticas. Restrito a admin/supervisor.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

const TABELAS_CRITICAS = [
  "call_control_audit_logs",
  "call_sessions",
  "call_recordings",
  "voip_trunks",
];

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Nao autorizado" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const comoUsuario = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: { user }, error: authError } = await comoUsuario.auth
      .getUser();
    if (authError || !user) return json({ error: "Nao autorizado" }, 401);

    const { data: roles } = await admin.from("user_roles").select("role")
      .eq("user_id", user.id).in("role", ["admin", "supervisor"]).eq("is_active", true);
    if (!roles || roles.length === 0) {
      return json({ error: "Acesso negado" }, 403);
    }

    // check_rls_enabled(table_name text) RETURNS boolean — RPC publico que ja existia no banco.
    // Antes o resultado deste RPC era descartado e o codigo caia em
    // `supabase.from('pg_class')`, que consulta a TABELA pg_class do schema public via
    // PostgREST (inexistente) em vez do catalogo do sistema. O `|| false` transformava
    // isso em "RLS desabilitado" permanente para todas as tabelas.
    const rls_check = [];
    for (const table of TABELAS_CRITICAS) {
      const { data, error } = await admin.rpc("check_rls_enabled", {
        table_name: table,
      });
      if (error) {
        rls_check.push({
          table,
          rls_enabled: null,
          status: "ERRO: " + error.message,
        });
        continue;
      }
      rls_check.push({
        table,
        rls_enabled: data === true,
        status: data === true ? "PASS" : "FAIL",
      });
    }

    // check_all_tables_rls_status() RETURNS TABLE(table_name text, rls_enabled boolean) —
    // RPC publica existente. Substitui get_table_policies/check_db_policies, que nao
    // existem em public e faziam as chamadas anteriores falharem em silencio.
    const { data: todas, error: todasErr } = await admin.rpc(
      "check_all_tables_rls_status",
    );
    const policies = todasErr
      ? null
      : (todas ?? []).filter((r: { table_name: string }) =>
        TABELAS_CRITICAS.includes(r.table_name)
      );

    return json({
      audit_timestamp: new Date().toISOString(),
      rls_check,
      policies,
      policies_error: todasErr ? todasErr.message : null,
      resumo: {
        verificadas: rls_check.length,
        com_rls: rls_check.filter((r) => r.rls_enabled === true).length,
        sem_rls: rls_check.filter((r) => r.rls_enabled === false).length,
        com_erro: rls_check.filter((r) => r.rls_enabled === null).length,
      },
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "erro desconhecido",
    }, 500);
  }
});
