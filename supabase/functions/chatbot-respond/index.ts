import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { requireUser } from '../_shared/auth.ts';
import { mesmaString } from '../_shared/constant-time.ts';
import { checkRateLimitDB, getClientIp } from '../_shared/rate-limit.ts';
import { uuid } from '../_shared/validate.ts';
import { fetchComPrazo } from "../_shared/resilience.ts";

interface ChatbotPayload {
  conversation_id: string;
  user_message: string;
  visitor_token?: string;
}

 const DEFAULT_THRESHOLD = 0.7;
const MODEL = 'google/gemini-2.5-flash';

export async function handler(req: Request): Promise<Response> {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const startTime = Date.now();

  try {
    const body = (await req.json()) as ChatbotPayload;

    if (!body.conversation_id || !body.user_message) {
      return new Response(
        JSON.stringify({ error: 'conversation_id e user_message obrigatórios' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const convId = uuid()(body.conversation_id);
    if (!convId.ok) {
      return new Response(JSON.stringify({ error: 'conversation_id invalido' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // A-014: quem chega pelo widget prova a posse da conversa com o visitor_token da sessao
    // anonima; quem ja esta logado (Inbox) atende a conversa como equipe.
    let actorUserId: string | undefined;
    const visitorToken = typeof body.visitor_token === 'string' ? body.visitor_token.trim() : '';

    if (visitorToken) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('visitor_token, conversation_id')
        .eq('visitor_token', visitorToken)
        .maybeSingle();

      if (!session) {
        return new Response(JSON.stringify({ error: 'visitor_token invalido' }), {
          status: 401,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const daSessao = String(session.conversation_id || '').toLowerCase();
      if (!daSessao || !mesmaString(daSessao, convId.data.toLowerCase())) {
        return new Response(JSON.stringify({ error: 'Conversa nao pertence a esta sessao' }), {
          status: 403,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const auth = await requireUser(req);
      if (auth instanceof Response) return auth;
      actorUserId = auth.user.id;
    }

    const rl = await checkRateLimitDB(getClientIp(req), 'chatbot-respond', actorUserId);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite de requisicoes excedido' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada');

    // Buscar artigos KB relevantes via full-text search (português)
    const searchTerms = body.user_message
      .toLowerCase()
      .replace(/[^\wáàâãéèêíïóôõöúçñ\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5)
      .join(' | ');

    const { data: articles } = await supabase
      .from('kb_articles')
      .select('id, title, excerpt, content')
      .eq('status', 'published')
      .textSearch('search_vector', searchTerms || body.user_message, {
        type: 'websearch',
        config: 'portuguese',
      })
      .limit(3);

    const kbContext =
      articles && articles.length > 0
        ? articles
            .map(
              (a, i) =>
                `[Artigo ${i + 1}] ${a.title}\n${a.excerpt || ''}\n${(a.content || '').slice(0, 500)}`
            )
            .join('\n\n')
        : 'Nenhum artigo relevante encontrado na base.';

     // Buscar configurações de threshold e histórico da conversa
     const [settingsRes, convRes, historyRes] = await Promise.all([
       supabase.from('system_settings').select('value').eq('key', 'bot_handoff_threshold').maybeSingle(),
       supabase.from('conversations').select('handoff_threshold').eq('id', body.conversation_id).maybeSingle(),
       supabase.from('conversation_messages')
         .select('direction, content')
         .eq('conversation_id', body.conversation_id)
         .order('created_at', { ascending: false })
         .limit(6)
     ]);
 
     const globalThreshold = parseFloat(settingsRes.data?.value as string || DEFAULT_THRESHOLD.toString()); // safe-numeric-ok: valor já validado por schema Zod ou vindo de linha do DB tipada
     const conversationThreshold = convRes.data?.handoff_threshold;
     const activeThreshold = conversationThreshold ?? globalThreshold;
 
     const history = historyRes.data;

    const historyMessages = (history || [])
      .reverse()
      .map((m) => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.content,
      }));

    const systemPrompt = `Você é um assistente de atendimento ao cliente em português do Brasil.
Use APENAS as informações da base de conhecimento abaixo para responder.
Se a pergunta não puder ser respondida com base nestes artigos OU se o usuário pedir explicitamente para falar com um humano, responda com handoff=true.

BASE DE CONHECIMENTO:
${kbContext}

Responda de forma clara, cordial e objetiva. Use markdown leve quando útil.`;

    let aiResp: Response;
    try { aiResp = await fetchComPrazo('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: body.user_message },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'respond_to_user',
              description: 'Retorna a resposta estruturada ao usuário',
              parameters: {
                type: 'object',
                properties: {
                  response: { type: 'string', description: 'Resposta para o usuário' },
                  intent: { type: 'string', description: 'Intenção detectada (ex: pergunta_tecnica, reclamacao, info_produto)' },
                  confidence: {
                    type: 'number',
                    description: 'Confiança da resposta entre 0 e 1',
                  },
                  handoff: {
                    type: 'boolean',
                    description: 'true se deve transferir para humano',
                  },
                  handoff_reason: { type: 'string' },
                },
                required: ['response', 'intent', 'confidence', 'handoff'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'respond_to_user' } },
      }),
    }); } catch (err) {
      console.error('[chatbot-respond] IA sem resposta no prazo:', err);
      return new Response(
        JSON.stringify({ error: 'Serviço de IA indisponível' }),
        { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!aiResp.ok) {
      // 402/429 do provedor nao sao erro do cliente: para nos e indisponibilidade.
      console.error('[chatbot-respond] AI gateway error', aiResp.status);
      return new Response(
        JSON.stringify({ error: 'Serviço de IA indisponível' }),
        { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('Resposta sem tool call');

    const parsed = JSON.parse(toolCall.function.arguments);
    const responseTimeMs = Date.now() - startTime;
     const shouldHandoff = parsed.handoff || parsed.confidence < activeThreshold;

    // Inserir mensagem do bot na conversa
    await supabase.from('conversation_messages').insert({
      conversation_id: body.conversation_id,
      direction: 'outbound',
      sender_type: 'bot',
      sender_name: 'Assistente IA',
      content: parsed.response,
      content_type: 'markdown',
      metadata: { intent: parsed.intent, confidence: parsed.confidence },
    });

    // Auditar interação
    await supabase.from('bot_conversations').insert({
      conversation_id: body.conversation_id,
      user_message: body.user_message,
      bot_response: parsed.response,
      intent: parsed.intent,
      confidence: parsed.confidence,
      suggested_articles: (articles || []).map((a) => a.id),
      handoff_triggered: shouldHandoff,
      handoff_reason: shouldHandoff ? parsed.handoff_reason || 'baixa_confianca' : null,
      response_time_ms: responseTimeMs,
      model_used: MODEL,
    });

    if (shouldHandoff) {
      await supabase
        .from('conversations')
        .update({ status: 'pending', priority: 'high' })
        .eq('id', body.conversation_id);
    }

    return new Response(
      JSON.stringify({
        response: parsed.response,
        intent: parsed.intent,
        confidence: parsed.confidence,
        handoff: shouldHandoff,
        suggested_articles: articles || [],
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('chatbot-respond error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(handler);
