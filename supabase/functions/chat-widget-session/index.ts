import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimitDB, getClientIp } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    // Endpoint público e anônimo (widget de chat sem login): a única defesa contra abuso
    // é por IP, já que não há usuário autenticado nem visitor_token antes do 'create'.
    const rl = await checkRateLimitDB(getClientIp(req), 'chat-widget-session');
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'create';

    if (action === 'create') {
      // Criar nova sessão anônima
      const visitorToken = crypto.randomUUID();
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          visitor_token: visitorToken,
          visitor_name: body.visitor_name,
          visitor_email: body.visitor_email,
          origin_url: body.origin_url,
          user_agent: req.headers.get('user-agent'),
          referrer: body.referrer,
          device_info: body.device_info || {},
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          visitor_token: session.visitor_token,
          session_id: session.id,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send_message') {
      if (!body.visitor_token || !body.message) {
        return new Response(
          JSON.stringify({ error: 'visitor_token e message são obrigatórios' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('visitor_token', body.visitor_token)
        .maybeSingle();

      if (!session) {
        return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
          status: 404,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      let conversationId = session.conversation_id;

      if (!conversationId) {
        // Criar conversa vinculada
        const { data: agents } = await supabase
          .from('agents')
          .select('name')
          .eq('status', 'available')
          .limit(10);
        let assignedAgent: string | null = null;
        if (agents && agents.length > 0) {
          assignedAgent = agents[0].name;
        }

        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            channel: 'chat',
            status: 'open',
            priority: 'normal',
            subject: `Chat: ${session.visitor_name || 'Visitante'}`,
            assigned_agent_name: assignedAgent,
            external_metadata: {
              visitor_token: session.visitor_token,
              origin_url: session.origin_url,
            },
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select('id')
          .single();

        if (convErr) throw convErr;
        conversationId = newConv.id;

        await supabase
          .from('chat_sessions')
          .update({ conversation_id: conversationId, last_seen_at: new Date().toISOString() })
          .eq('id', session.id);
      } else {
        await supabase
          .from('chat_sessions')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', session.id);
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString(), status: 'open' })
          .eq('id', conversationId);
      }

      const { error: msgErr } = await supabase.from('conversation_messages').insert({
        conversation_id: conversationId,
        direction: 'inbound',
        sender_type: 'contact',
        sender_name: session.visitor_name || 'Visitante',
        sender_identifier: session.visitor_token,
        content: body.message,
        content_type: 'text',
      });

      if (msgErr) throw msgErr;

      return new Response(
        JSON.stringify({ success: true, conversation_id: conversationId }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetch_messages') {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('conversation_id')
        .eq('visitor_token', body.visitor_token)
        .maybeSingle();

      if (!session?.conversation_id) {
        return new Response(JSON.stringify({ messages: [] }), {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('id, direction, sender_type, sender_name, content, content_type, created_at')
        .eq('conversation_id', session.conversation_id)
        .eq('is_private_note', false)
        .order('created_at', { ascending: true })
        .limit(100);

      return new Response(JSON.stringify({ messages: messages || [] }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('chat-widget-session error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
