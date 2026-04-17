import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface WhatsAppInboundPayload {
  from: string;
  name?: string;
  message: string;
  message_id?: string;
  timestamp?: string;
  attachments?: Array<{ url: string; type: string; filename?: string }>;
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as WhatsAppInboundPayload;

    if (!body.from || !body.message) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: from, message' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const normalizedPhone = body.from.replace(/[^0-9]/g, '');

    // Encontrar contato existente por telefone
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .or(`phone.eq.${body.from},phone.eq.${normalizedPhone}`)
      .maybeSingle();

    // Procurar conversa aberta deste contato no canal whatsapp
    let conversationId: string | null = null;
    if (contact) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('channel', 'whatsapp')
        .in('status', ['open', 'pending'])
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      conversationId = existingConv?.id ?? null;
    }

    // Roteamento simples: agente disponível com menos conversas ativas
    let assignedAgent: string | null = null;
    if (!conversationId) {
      const { data: agents } = await supabase
        .from('agents')
        .select('name')
        .eq('status', 'available')
        .limit(10);

      if (agents && agents.length > 0) {
        const counts = await Promise.all(
          agents.map(async (a) => {
            const { count } = await supabase
              .from('conversations')
              .select('id', { count: 'exact', head: true })
              .eq('assigned_agent_name', a.name)
              .in('status', ['open', 'pending']);
            return { name: a.name, count: count ?? 0 };
          })
        );
        counts.sort((a, b) => a.count - b.count);
        assignedAgent = counts[0]?.name ?? null;
      }

      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          channel: 'whatsapp',
          status: 'open',
          priority: 'normal',
          subject: `WhatsApp: ${body.name || body.from}`,
          contact_id: contact?.id ?? null,
          assigned_agent_name: assignedAgent,
          external_id: body.message_id,
          external_metadata: { from: body.from, name: body.name },
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select('id')
        .single();

      if (convErr) throw convErr;
      conversationId = newConv.id;
    } else {
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          status: 'open',
        })
        .eq('id', conversationId);
    }

    // Inserir mensagem
    const { error: msgErr } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        direction: 'inbound',
        sender_type: 'contact',
        sender_name: body.name || body.from,
        sender_identifier: body.from,
        content: body.message,
        content_type: 'text',
        attachments: body.attachments || [],
        metadata: { message_id: body.message_id, timestamp: body.timestamp },
      });

    if (msgErr) throw msgErr;

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversationId }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('whatsapp-inbound error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
