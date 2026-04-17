import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface ChatbotPayload {
  conversation_id: string;
  user_message: string;
  visitor_token?: string;
}

const CONFIDENCE_THRESHOLD = 0.7;
const MODEL = 'google/gemini-2.5-flash';

Deno.serve(async (req) => {
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY não configurada');

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

    // Histórico recente da conversa
    const { data: history } = await supabase
      .from('conversation_messages')
      .select('direction, content')
      .eq('conversation_id', body.conversation_id)
      .order('created_at', { ascending: false })
      .limit(6);

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

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido, tente em instantes.' }),
          { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos esgotados. Adicione créditos no workspace Lovable AI.' }),
          { status: 402, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('Resposta sem tool call');

    const parsed = JSON.parse(toolCall.function.arguments);
    const responseTimeMs = Date.now() - startTime;
    const shouldHandoff = parsed.handoff || parsed.confidence < CONFIDENCE_THRESHOLD;

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
});
