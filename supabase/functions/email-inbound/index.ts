import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface EmailInboundPayload {
  from: string;
  from_name?: string;
  to: string[];
  cc?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  message_id?: string;
  in_reply_to?: string;
  headers?: Record<string, string>;
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

    const body = (await req.json()) as EmailInboundPayload;

    if (!body.from || !body.subject) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: from, subject' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Threading: tenta encontrar ticket existente por in_reply_to → conversation_id
    let conversationId: string | null = null;
    let threadId = body.message_id;

    if (body.in_reply_to) {
      const { data: parentTicket } = await supabase
        .from('email_tickets')
        .select('conversation_id, thread_id')
        .eq('message_id', body.in_reply_to)
        .maybeSingle();
      if (parentTicket) {
        conversationId = parentTicket.conversation_id;
        threadId = parentTicket.thread_id;
      }
    }

    // Fallback: threading por subject normalizado (Re:/Fwd: removidos)
    if (!conversationId) {
      const cleanSubject = body.subject.replace(/^(Re|Fwd|RE|FWD|FW):\s*/gi, '').trim();
      const { data: similarConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('channel', 'email')
        .ilike('subject', `%${cleanSubject}%`)
        .in('status', ['open', 'pending'])
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (similarConv) conversationId = similarConv.id;
    }

    // Encontrar contato pelo email
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', body.from)
      .maybeSingle();

    // Roteamento por regras → fallback agente menos carregado
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
          channel: 'email',
          status: 'open',
          priority: 'normal',
          subject: body.subject,
          contact_id: contact?.id ?? null,
          assigned_agent_name: assignedAgent,
          external_id: body.message_id,
          external_metadata: { from: body.from, from_name: body.from_name },
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
        .update({ last_message_at: new Date().toISOString(), status: 'open' })
        .eq('id', conversationId);
    }

    // Inserir ticket de email
    const { error: ticketErr } = await supabase.from('email_tickets').insert({
      conversation_id: conversationId,
      message_id: body.message_id,
      in_reply_to: body.in_reply_to,
      thread_id: threadId,
      from_email: body.from,
      to_emails: body.to,
      cc_emails: body.cc || [],
      subject: body.subject,
      body_text: body.body_text,
      body_html: body.body_html,
      headers: body.headers || {},
    });

    if (ticketErr) throw ticketErr;

    // Inserir mensagem na conversa
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      direction: 'inbound',
      sender_type: 'contact',
      sender_name: body.from_name || body.from,
      sender_identifier: body.from,
      content: body.body_text || body.body_html || '(sem corpo)',
      content_type: body.body_html ? 'html' : 'text',
      metadata: { message_id: body.message_id, subject: body.subject },
    });

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversationId }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('email-inbound error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
