// edge-public-ok — webhook do provedor de WhatsApp; autenticidade provada por HMAC
// (etapa 013), não por JWT de usuário.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { validateBody, createErrorResponse } from '../_shared/validator.ts';
import { verifyHmac } from '../_shared/webhook-signature.ts';

const assinaturaObrigatoria = () => Deno.env.get('WEBHOOK_ENFORCE_WAVOIP_SIGNATURE') === 'true';
import { WhatsAppInboundV1Schema, WhatsAppInboundV2Schema } from './schema.ts';
import { detectReplay, normalizePhone, isDuplicateMessageError } from './idempotency.ts';
import { GENERIC_INTERNAL_MESSAGE, getCorrelationId } from '../_shared/errors.ts';

export async function handler(req: Request): Promise<Response> {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    if (req.method !== 'POST') {
      return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', undefined, 405, cors);
    }

    const url = new URL(req.url);
    const version = url.searchParams.get('v') || 'v1';

    // Corpo cru lido uma vez: HMAC do provedor so bate sobre os bytes originais.
    const rawBody = await req.text();
    const assinatura = await verifyHmac(req, rawBody, 'WAVOIP_WEBHOOK_SECRET');
    if (assinaturaObrigatoria() && assinatura !== 'valid' && assinatura !== 'not_configured') {
      return createErrorResponse('Assinatura do webhook inválida', 'invalid_signature', undefined, 401, cors);
    }

    let validationResult;
    if (version === 'v2') {
      validationResult = await validateBody(req, WhatsAppInboundV2Schema, cors, { rawBody });
    } else {
      validationResult = await validateBody(req, WhatsAppInboundV1Schema, cors, { rawBody });
    }

    if (validationResult.errorResponse) return validationResult.errorResponse;
    const body = validationResult.data!;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Idempotência: provedores de WhatsApp reentregam a mesma mensagem quando não
    // recebem 200. Sem esta checagem cada retry duplicaria a mensagem na conversa.
    const externalMessageId = 'message_id' in body ? body.message_id : undefined;

    let replaySource: { id: string; conversation_id: string } | null = null;
    if (externalMessageId) {
      const { data: alreadyStored, error: dedupError } = await supabase
        .from('conversation_messages')
        .select('id, conversation_id')
        .eq('metadata->>message_id', externalMessageId)
        .limit(1)
        .maybeSingle();

      // Erro de dedup não pode derrubar a entrega: registra e segue.
      if (dedupError) console.error('whatsapp-inbound dedup error:', dedupError);
      else replaySource = alreadyStored ?? null;
    }

    let conversationByExternalId: { id: string } | null = null;
    if (!replaySource && externalMessageId) {
      const { data: convByExternalId } = await supabase
        .from('conversations')
        .select('id')
        .eq('channel', 'whatsapp')
        .eq('external_id', externalMessageId)
        .maybeSingle();
      conversationByExternalId = convByExternalId ?? null;
    }

    const replay = detectReplay(version, replaySource, conversationByExternalId);
    if (replay) {
      return new Response(JSON.stringify(replay), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const fromPhone = 'from' in body ? body.from : '';
    const messageContent = 'message' in body ? body.message : '';
    const normalizedPhone = normalizePhone(fromPhone);

    // Encontrar contato existente por telefone. `in` recebe array (o cliente
    // escapa cada valor) em vez de montar a gramatica do filtro por concatenacao.
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .in('phone', [...new Set([fromPhone, normalizedPhone])])
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
      // Best-effort: a mensagem logo abaixo e a fonte da verdade.
      const { error: touchErr } = await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          status: 'open',
        })
        .eq('id', conversationId);
      if (touchErr) console.error('whatsapp-inbound: falha ao atualizar conversa existente', touchErr);
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

    if (msgErr) {
      // Corrida entre reentregas: as duas passam pela leitura de dedup acima e a
      // segunda é barrada pelo índice único (etapa 017). Reentrega é 200, não 500 —
      // devolver 5xx faria o provedor insistir para sempre.
      if (isDuplicateMessageError(msgErr) && externalMessageId) {
        const { data: stored } = await supabase
          .from('conversation_messages')
          .select('id, conversation_id')
          .eq('metadata->>message_id', externalMessageId)
          .limit(1)
          .maybeSingle();

        const conflictReplay = detectReplay(version, stored ?? null, conversationByExternalId);
        if (conflictReplay) {
          return new Response(JSON.stringify(conflictReplay), {
            status: 200,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
      }
      throw msgErr;
    }

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversationId, version }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('whatsapp-inbound error:', error);
    const correlationId = getCorrelationId(req);
    console.error('[whatsapp-inbound] erro interno', { correlation_id: correlationId, error });
    return createErrorResponse(GENERIC_INTERNAL_MESSAGE, 'INTERNAL_ERROR', undefined, 500, cors);
  }
}



// Deno.serve so quando executado como funcao (os testes importam o handler).
if (import.meta.main) Deno.serve(handler);
