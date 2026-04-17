import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar políticas SLA ativas
    const { data: policies } = await supabase
      .from('sla_policies')
      .select('*')
      .eq('is_active', true);

    if (!policies || policies.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, applied: 0, breaches: 0, message: 'Sem políticas ativas' }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Conversas abertas sem SLA calculado ainda
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, channel, priority, status, created_at, first_response_at, sla_first_response_due_at, sla_resolution_due_at, sla_breached, assigned_agent_name')
      .in('status', ['open', 'pending']);

    let applied = 0;
    let breaches = 0;
    const now = new Date();

    for (const conv of conversations || []) {
      // Encontrar política mais específica (canal exato + prioridade exata > all)
      const matched = policies.find(
        (p) =>
          (p.channel === conv.channel || p.channel === 'all') &&
          (p.priority === conv.priority || p.priority === 'all')
      );
      if (!matched) continue;

      const createdAt = new Date(conv.created_at);
      const updates: Record<string, unknown> = {};

      if (!conv.sla_first_response_due_at) {
        updates.sla_first_response_due_at = new Date(
          createdAt.getTime() + matched.first_response_minutes * 60_000
        ).toISOString();
        applied++;
      }
      if (!conv.sla_resolution_due_at) {
        updates.sla_resolution_due_at = new Date(
          createdAt.getTime() + matched.resolution_minutes * 60_000
        ).toISOString();
      }

      // Detectar breach
      const firstResponseDue = conv.sla_first_response_due_at
        ? new Date(conv.sla_first_response_due_at)
        : (updates.sla_first_response_due_at ? new Date(updates.sla_first_response_due_at as string) : null);
      const resolutionDue = conv.sla_resolution_due_at
        ? new Date(conv.sla_resolution_due_at)
        : (updates.sla_resolution_due_at ? new Date(updates.sla_resolution_due_at as string) : null);

      const firstResponseBreached =
        !conv.first_response_at && firstResponseDue && now > firstResponseDue;
      const resolutionBreached =
        conv.status !== 'resolved' && resolutionDue && now > resolutionDue;

      if ((firstResponseBreached || resolutionBreached) && !conv.sla_breached) {
        updates.sla_breached = true;
        breaches++;

        // Criar alerta in-app
        await supabase.from('notifications').insert({
          user_id: null,
          type: 'sla_breach',
          title: 'SLA violado',
          message: `Conversa ${conv.id.slice(0, 8)} excedeu SLA (${firstResponseBreached ? 'primeira resposta' : 'resolução'})`,
          severity: 'high',
          metadata: {
            conversation_id: conv.id,
            agent: conv.assigned_agent_name,
            type: firstResponseBreached ? 'first_response' : 'resolution',
          },
        }).then(() => null, () => null);
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('conversations').update(updates).eq('id', conv.id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, applied, breaches, total_checked: conversations?.length ?? 0 }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('enforce-sla error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
