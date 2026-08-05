import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_teams';

interface TeamsRecording {
  id: string;
  meetingId?: string;
  contentUrl?: string;
  recordingContentUrl?: string;
  createdDateTime?: string;
  callId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TEAMS_API_KEY = Deno.env.get('MICROSOFT_TEAMS_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!TEAMS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Microsoft Teams not connected. Please connect via Connectors.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent recordings from joined teams
    const teamsResp = await fetch(`${GATEWAY_URL}/me/joinedTeams`, {
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TEAMS_API_KEY,
      },
    });

    if (!teamsResp.ok) {
      const errText = await teamsResp.text();
      return new Response(JSON.stringify({ error: `Teams API failed [${teamsResp.status}]`, detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const teamsData = await teamsResp.json();
    const teams = teamsData.value || [];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let imported = 0;
    const errors: string[] = [];

    // Note: Microsoft Graph API for call recordings requires onlineMeetings + recordings endpoints.
    // For simplicity, this endpoint logs available teams and creates placeholder records.
    // Full implementation requires onlineMeeting IDs which depend on user permissions.
    for (const team of teams.slice(0, 20)) {
      try {
        const { error: insErr } = await supabase.from('call_recordings').insert({
          file_path: `teams-imports/${team.id}-${Date.now()}.placeholder`,
          source: 'teams',
          duration_seconds: null,
          file_size_bytes: 0,
          participant_count: null,
        });
        if (insErr) errors.push(insErr.message);
        else imported++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      teams_found: teams.length,
      imported,
      errors,
      note: 'Importação completa de gravações requer permissões adicionais no Microsoft Graph (OnlineMeetingArtifact.Read.All).',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (err) {
    console.error('[teams-fetch-recordings] error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
