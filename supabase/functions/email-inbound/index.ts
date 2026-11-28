import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { createErrorResponse } from '../_shared/validator.ts';
import { getCorrelationId, internalErrorResponse } from '../_shared/errors.ts';
import { EmailInboundSchema } from './schema.ts';
import { verifyHmac } from '../_shared/webhook-signature.ts';

const assinaturaObrigatoria = () => Deno.env.get('WEBHOOK_ENFORCE_EMAIL_INBOUND_SIGNATURE') === 'true';


export async function handler(req: Request): Promise<Response> {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Le o corpo cru uma unica vez: JSON.stringify(json) muda espacos e ordem
    // de chaves e o HMAC do provedor nunca bateria.
    const texto = await req.text();
    let raw: any;
    try {
      raw = JSON.parse(texto);
    } catch {
      return new Response(JSON.stringify({ error: 'Corpo nao e JSON valido' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const assinatura = await verifyHmac(req, texto, 'EMAIL_WEBHOOK_SECRET');
    if (assinaturaObrigatoria() && assinatura !== 'valid' && assinatura !== 'not_configured') {
      return new Response(
        JSON.stringify({ code: 'invalid_signature', error: 'Assinatura do webhook invalida' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Contrato historico desta edge (400/422), preservado para o provedor de e-mail.
    if (!raw?.from || !raw?.subject) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: from, subject' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Sem message_id nao existe chave de deduplicacao: o provedor reentrega em
    // 5xx e cada volta criava uma conversa nova. Melhor recusar na entrada.
    if (!raw.message_id) {
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório: message_id (idempotência)' }),
        { status: 422, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Tetos de tamanho e tipos: 422 com `fields` apontando o campo (A-129).
    const parsed = EmailInboundSchema.safeParse(raw);
    if (!parsed.success) {
      return createErrorResponse(
        'Dados inválidos',
        'VALIDATION_ERROR',
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), error: e.message })),
        422,
        cors,
      );
    }
    const body = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Reentrega do provedor: o ticket ja existe, entao devolvemos 200 para ele
    // parar de reenviar (5xx aqui e o que alimentava o laco).
    const { data: existingTicket, error: existingErr } = await supabase
      .from('email_tickets')
      .select('conversation_id')
      .eq('message_id', body.message_id)
      .maybeSingle();

    if (existingErr) throw existingErr;

    if (existingTicket) {
      return new Response(
        JSON.stringify({
          success: true,
          idempotent_replay: true,
          conversation_id: existingTicket.conversation_id,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

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
      // Best-effort: last_message_at/status sao derivaveis das mensagens ja gravadas abaixo.
      const { error: touchErr } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString(), status: 'open' })
        .eq('id', conversationId);
      if (touchErr) console.error('email-inbound: falha ao atualizar conversa existente', touchErr);
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

    if (ticketErr) {
      // 23505 = unique_violation em email_tickets.message_id: duas entregas
      // simultaneas passaram pelo pre-check. Trata como replay para nao gerar laco.
      if ((ticketErr as { code?: string }).code === '23505') {
        const { data: raced } = await supabase
          .from('email_tickets')
          .select('conversation_id')
          .eq('message_id', body.message_id)
          .maybeSingle();
        return new Response(
          JSON.stringify({
            success: true,
            idempotent_replay: true,
            conversation_id: raced?.conversation_id ?? conversationId,
          }),
          { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
      throw ticketErr;
    }

    // Inserir mensagem na conversa
    const { error: messageErr } = await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      direction: 'inbound',
      sender_type: 'contact',
      sender_name: body.from_name || body.from,
      sender_identifier: body.from,
      content: body.body_text || body.body_html || '(sem corpo)',
      content_type: body.body_html ? 'html' : 'text',
      metadata: { message_id: body.message_id, subject: body.subject },
    });

    if (messageErr) throw messageErr;

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversationId }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return internalErrorResponse(error, getCorrelationId(req), cors, { fn: 'email-inbound' });
  }
}

Deno.serve(handler);
