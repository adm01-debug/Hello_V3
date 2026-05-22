import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validateBody, createErrorResponse } from '../_shared/validator.ts';
import { WhatsAppInboundV1Schema, WhatsAppInboundV2Schema } from './schema.ts';

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    if (req.method !== 'POST') {
      return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', undefined, 405, cors);
    }

    const url = new URL(req.url);
    const version = url.searchParams.get('v') || 'v1';

    let validationResult;
    if (version === 'v2') {
      validationResult = await validateBody(req, WhatsAppInboundV2Schema, cors);
    } else {
      validationResult = await validateBody(req, WhatsAppInboundV1Schema, cors);
    }

    if (validationResult.errorResponse) return validationResult.errorResponse;
    const body = validationResult.data!;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const fromPhone = 'from' in body ? body.from : '';
    const messageContent = 'message' in body ? body.message : '';
    const normalizedPhone = fromPhone.replace(/[^0-9]/g, '');

    // Encontrar contato existente por telefone
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .or(`phone.eq.${fromPhone},phone.eq.${normalizedPhone}`)
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
          subject: `WhatsApp: ${body.name || fromPhone}`,
          contact_id: contact?.id ?? null,
          assigned_agent_name: assignedAgent,
          external_id: body.message_id,
          external_metadata: { from: fromPhone, name: body.name, version },
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
        sender_name: body.name || fromPhone,
        sender_identifier: fromPhone,
        content: messageContent,
        content_type: 'text',
        attachments: body.attachments || [],
        metadata: { message_id: body.message_id, timestamp: body.timestamp, version },
      });

    if (msgErr) throw msgErr;

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversationId, version }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('whatsapp-inbound error:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Erro interno', 'INTERNAL_ERROR', undefined, 500, cors);
  }
});

