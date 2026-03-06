import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { recordingId, filePath } = body;
    
    if (!recordingId || !filePath || typeof recordingId !== 'string' || typeof filePath !== 'string') {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Transcribing recording for user: ${user.id}`);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Serviço não configurado' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('call-recordings')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      return new Response(JSON.stringify({ error: 'Arquivo não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = new FormData();
    formData.append('file', fileData, 'recording.webm');
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', 'por');
    formData.append('diarize', 'true');
    formData.append('tag_audio_events', 'true');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: formData,
    });

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status);
      return new Response(JSON.stringify({ error: 'Erro no serviço de transcrição' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcription = await response.json();

    const { data: recording } = await supabaseAdmin
      .from('call_recordings')
      .select('call_session_id')
      .eq('id', recordingId)
      .maybeSingle();

    if (recording?.call_session_id && transcription.words) {
      let currentSpeaker = '';
      let currentText = '';
      let currentStartTime = 0;
      const transcriptionEntries: any[] = [];

      for (const word of transcription.words) {
        const speaker = word.speaker || 'unknown';
        
        if (speaker !== currentSpeaker && currentText) {
          transcriptionEntries.push({
            call_session_id: recording.call_session_id,
            speaker: currentSpeaker || 'Speaker',
            text: currentText.trim(),
            start_time: currentStartTime,
            end_time: word.start,
          });
          currentText = '';
          currentStartTime = word.start || 0;
        }
        
        currentSpeaker = speaker;
        currentText += word.text + ' ';
      }

      if (currentText) {
        transcriptionEntries.push({
          call_session_id: recording.call_session_id,
          speaker: currentSpeaker || 'Speaker',
          text: currentText.trim(),
          start_time: currentStartTime,
          end_time: transcription.words[transcription.words.length - 1]?.end || 0,
        });
      }

      if (transcriptionEntries.length > 0) {
        await supabaseAdmin.from('call_transcriptions').insert(transcriptionEntries);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: transcription.text,
        words: transcription.words,
        audioEvents: transcription.audio_events,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
