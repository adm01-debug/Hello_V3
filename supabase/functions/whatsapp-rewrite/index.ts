import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { validate, string, optional } from "../_shared/validate.ts";
import { checkRateLimitDB, getClientIp } from "../_shared/rate-limit.ts";

type Tone = "profissional" | "amigavel" | "conciso" | "empatico";

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  profissional: "Reescreva a mensagem em português (PT-BR) com tom profissional, cordial e objetivo. Corrija ortografia e pontuação.",
  amigavel: "Reescreva a mensagem em português (PT-BR) com tom amigável, acolhedor e próximo, sem gírias excessivas. Corrija ortografia.",
  conciso: "Reescreva a mensagem em português (PT-BR) de forma clara, direta e curta. Remova redundâncias e mantenha o sentido.",
  empatico: "Reescreva a mensagem em português (PT-BR) com tom empático, demonstrando escuta ativa e compreensão do problema do cliente.",
};

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const rl = await checkRateLimitDB(getClientIp(req), "whatsapp-rewrite", user.id);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Limite excedido" }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = validate(body, {
      message: string({ min: 1, max: 4000 }),
      tone: optional(string({ max: 20 })),
      context: optional(string({ max: 500 })),
    });

    if (!parsed.ok) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", details: parsed.errors }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const message = parsed.data.message as string;
    const requestedTone = (parsed.data.tone as string | undefined) ?? "profissional";
    const tone: Tone = (requestedTone in TONE_INSTRUCTIONS ? requestedTone : "profissional") as Tone;
    const context = (parsed.data.context as string | undefined) ?? "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Serviço indisponível" }), {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você reescreve mensagens de WhatsApp para atendimento de call center. ${TONE_INSTRUCTIONS[tone]} Nunca invente informações. Responda APENAS com a mensagem reescrita, sem prefixos ou explicações.`;
    const userPrompt = context
      ? `Contexto do atendimento: ${context}\n\nMensagem original:\n${message}`
      : `Mensagem original:\n${message}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de IA excedido" }), {
          status: 429,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes" }), {
          status: 402,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: "Falha na IA", details: errText.slice(0, 300) }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const rewritten = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

    if (!rewritten) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ rewritten, tone, originalLength: message.length, rewrittenLength: rewritten.length }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: "Erro interno", details: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
