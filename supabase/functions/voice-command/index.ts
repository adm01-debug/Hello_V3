import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { fetchComPrazo } from "../_shared/resilience.ts";
import { validateBody } from "../_shared/validator.ts";
import { VoiceCommandBodySchema } from "../_shared/ai-body-schemas.ts";


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const bodyParsed = await validateBody(req, VoiceCommandBodySchema, buildCorsHeaders(req), { endpoint: 'voice-command' });
    if (bodyParsed.errorResponse) return bodyParsed.errorResponse;
    const { audio } = bodyParsed.data!;
    if (!audio) {
      return new Response(JSON.stringify({ error: "Audio data required" }), {
        status: 400,
        headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Use Lovable AI to process the voice command
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    let response: Response;
    try { response = await fetchComPrazo("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a voice command processor for a contact center. Extract the intended action from the transcribed text. Return JSON with fields: command (original text), action (one of: dial, hold, transfer, mute, unmute, hangup, search_contact, none), target (phone number or name if applicable), confidence (0-1).",
          },
          {
            role: "user",
            content: `Process this voice command transcription and return the action: "${audio}"`,
          },
        ],
      }),
    }); } catch (err) {
      console.error("[voice-command] IA sem resposta no prazo:", err);
      return new Response(
        JSON.stringify({ error: "Serviço de IA indisponível" }),
        { status: 503, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (!response.ok) {
      console.error("[voice-command] AI gateway error", response.status);
      return new Response(
        JSON.stringify({ error: "Serviço de IA indisponível" }),
        { status: 503, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { command: audio, action: "none", confidence: 0.5 };
    } catch {
      parsed = { command: audio, action: "none", confidence: 0.5 };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Voice command error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
