import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GRAPH_URL = "https://graph.microsoft.com/v1.0";

// O gateway de conectores do Lovable deixou de existir. Esta edge passa a falar
// direto com o Microsoft Graph usando um app registration (client credentials).
async function obterTokenGraph(): Promise<string | null> {
  const tenant = Deno.env.get("MS_TENANT_ID");
  const clientId = Deno.env.get("MS_CLIENT_ID");
  const clientSecret = Deno.env.get("MS_CLIENT_SECRET");
  if (!tenant || !clientId || !clientSecret) return null;

  const resp = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    },
  );
  if (!resp.ok) {
    throw new Error(`Falha ao autenticar no Graph [${resp.status}]`);
  }
  const data = await resp.json();
  return data.access_token ?? null;
}

interface TeamsRecording {
  id: string;
  meetingId?: string;
  contentUrl?: string;
  recordingContentUrl?: string;
  createdDateTime?: string;
  callId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const negado = await exigirSessao(
    req,
    Deno.env.get("SUPABASE_URL")!,
    corsHeaders,
  );
  if (negado) return negado;

  try {
    let token: string | null;
    try {
      token = await obterTokenGraph();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Falha na autenticacao com o Microsoft Graph",
          detail: e instanceof Error ? e.message : String(e),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Microsoft Teams nao configurado",
          detail:
            "Defina os secrets MS_TENANT_ID, MS_CLIENT_ID e MS_CLIENT_SECRET para habilitar a importacao de gravacoes do Teams.",
          configurado: false,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Token app-only nao resolve /me; usar /groups (Application permission Group.Read.All)
    const teamsResp = await fetch(
      `${GRAPH_URL}/groups?$select=id,displayName&$top=20`,
      { headers: { "Authorization": `Bearer ${token}` } },
    );

    if (!teamsResp.ok) {
      const errText = await teamsResp.text();
      return new Response(
        JSON.stringify({
          error: `Teams API failed [${teamsResp.status}]`,
          detail: errText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const teamsData = await teamsResp.json();
    const teams = teamsData.value || [];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let imported = 0;
    const errors: string[] = [];

    // Note: Microsoft Graph API for call recordings requires onlineMeetings + recordings endpoints.
    // For simplicity, this endpoint logs available teams and creates placeholder records.
    // Full implementation requires onlineMeeting IDs which depend on user permissions.
    for (const team of teams.slice(0, 20)) {
      try {
        const { error: insErr } = await supabase.from("call_recordings").insert(
          {
            file_path: `teams-imports/${team.id}-${Date.now()}.placeholder`,
            source: "teams",
            duration_seconds: null,
            file_size_bytes: 0,
            participant_count: null,
          },
        );
        if (insErr) errors.push(insErr.message);
        else imported++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        teams_found: teams.length,
        imported,
        errors,
        note:
          "Importação completa de gravações requer permissões adicionais no Microsoft Graph (OnlineMeetingArtifact.Read.All).",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    console.error("[teams-fetch-recordings] error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Rejeita chamada sem JWT valido. As edges abaixo escrevem com service_role,
// entao a anon key publica nao pode ser suficiente para invoca-las.
async function exigirSessao(
  req: Request,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Nao autorizado" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  const comoUsuario = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error } = await comoUsuario.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Nao autorizado" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  return null;
}
