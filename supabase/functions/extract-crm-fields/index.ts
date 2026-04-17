import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, optional } from "../_shared/validate.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const rl = await checkRateLimitDB(getClientIp(req), 'extract-crm-fields', user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Limite excedido' }), {
        status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
        status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = validate(body, {
      callSessionId: string({ min: 1, max: 64 }),
      transcript: string({ min: 20, max: 50000 }),
      contactId: optional(string({ max: 64 })),
    });

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Dados inválidos', details: parsed.errors }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const callSessionId = parsed.data.callSessionId as string;
    const transcript = parsed.data.transcript as string;
    const contactId = (parsed.data.contactId as string) || null;

    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Carrega contato existente (se houver) para comparar com sugestões
    let currentContact: Record<string, unknown> = {};
    if (contactId) {
      const { data } = await adminClient.from('contacts')
        .select('id, name, company, position, email, notes')
        .eq('id', contactId).maybeSingle();
      if (data) currentContact = data;
    }

    const tools = [{
      type: 'function',
      function: {
        name: 'extract_crm_fields',
        description: 'Extrai campos atualizáveis do CRM a partir da transcrição da chamada.',
        parameters: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field_name: {
                    type: 'string',
                    enum: ['position', 'company', 'pain_point', 'budget', 'timeline', 'decision_maker', 'next_step', 'tags'],
                  },
                  suggested_value: { type: 'string' },
                  confidence: { type: 'number' },
                  source_quote: { type: 'string' },
                },
                required: ['field_name', 'suggested_value', 'confidence', 'source_quote'],
                additionalProperties: false,
              },
            },
          },
          required: ['suggestions'],
          additionalProperties: false,
        },
      },
    }];

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você extrai informações estruturadas para CRM a partir de transcrições de chamadas em português brasileiro. Só inclua campos com evidência clara na transcrição. confidence ∈ [0,1]. source_quote = trecho literal.' },
          { role: 'user', content: `Contato atual:\n${JSON.stringify(currentContact)}\n\nTranscrição:\n${transcript.slice(0, 30000)}` },
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'extract_crm_fields' } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de IA excedido' }), {
          status: 429, headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Falha na IA' }), {
        status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions: Array<{ field_name: string; suggested_value: string; confidence: number; source_quote: string }> = [];
    try {
      const args = toolCall ? JSON.parse(toolCall.function.arguments) : { suggestions: [] };
      suggestions = Array.isArray(args.suggestions) ? args.suggestions : [];
    } catch {
      suggestions = [];
    }

    if (suggestions.length === 0) {
      return new Response(JSON.stringify({ suggestions: [], inserted: 0 }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const rows = suggestions
      .filter((s) => s.suggested_value && s.suggested_value.trim().length > 0 && s.confidence >= 0.4)
      .map((s) => ({
        call_session_id: callSessionId,
        contact_id: contactId,
        field_name: s.field_name,
        current_value: contactId ? String((currentContact as Record<string, unknown>)[s.field_name] ?? '') : null,
        suggested_value: s.suggested_value.slice(0, 1000),
        confidence: Math.min(1, Math.max(0, s.confidence)),
        source_quote: s.source_quote.slice(0, 500),
        status: 'pending',
      }));

    if (rows.length > 0) {
      await adminClient.from('crm_field_suggestions').insert(rows);
    }

    return new Response(JSON.stringify({ suggestions: rows, inserted: rows.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro interno', message: String(e) }), {
      status: 500, headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
