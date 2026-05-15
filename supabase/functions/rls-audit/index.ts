import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const results = [];

    // 1. Verificar se RLS está habilitado nas tabelas críticas
    const tablesToCheck = ['call_control_audit_logs', 'call_sessions', 'call_recordings', 'voip_trunks'];
    for (const table of tablesToCheck) {
      const { data } = await supabase.rpc('check_rls_enabled', { table_name: table });
      // Como não temos esse RPC, vamos usar uma query direta
      const { data: rlsStatus } = await supabase.from('pg_class')
        .select('relrowsecurity')
        .eq('relname', table)
        .single();
      
      results.push({
        table,
        rls_enabled: rlsStatus?.relrowsecurity || false,
        status: rlsStatus?.relrowsecurity ? '✅ PASS' : '❌ FAIL'
      });
    }

    // 2. Simular acesso de Agente vs Admin (Lógica interna)
    // Buscamos as políticas registradas no banco
    const { data: policies } = await supabase.rpc('get_table_policies', { t_name: 'call_sessions' });
    // Se o RPC não existe, usamos query direta na pg_policies
    const { data: pgPolicies } = await supabase.rpc('check_db_policies'); 
    // Na verdade, vamos apenas rodar uma query SQL via RPC customizado ou direto se permitido.
    // Como estamos no Edge com Service Role, podemos ler pg_policies.
    
    const { data: policyDetails } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', tablesToCheck);

    return new Response(JSON.stringify({ 
      audit_timestamp: new Date().toISOString(),
      rls_check: results,
      policies: policyDetails 
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
