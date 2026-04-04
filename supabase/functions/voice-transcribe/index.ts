import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
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
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Serviço não configurado' }), {
        status: 503,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'Arquivo de áudio é obrigatório' }), {
        status: 400,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    console.log('Transcribing audio for user:', user.id, 'size:', audioFile.size);

    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

    const apiFormData = new FormData();
    apiFormData.append('file', audioBlob, 'recording.webm');
    apiFormData.append('model_id', 'scribe_v1');
    apiFormData.append('language_code', 'por');
    apiFormData.append('diarize', 'true');
    apiFormData.append('tag_audio_events', 'false');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: apiFormData,
    });

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status);
      return new Response(JSON.stringify({ error: 'Erro no serviço de transcrição' }), {
        status: 503,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const transcription = await response.json();

    const segments: { speaker: string; text: string; start: number; end: number }[] = [];
    
    if (transcription.words && transcription.words.length > 0) {
      let currentSpeaker = transcription.words[0].speaker || 'speaker_0';
      let currentText = '';
      let segmentStart = transcription.words[0].start || 0;
      let segmentEnd = 0;

      for (const word of transcription.words) {
        const speaker = word.speaker || 'speaker_0';
        
        if (speaker !== currentSpeaker) {
          if (currentText.trim()) {
            segments.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              start: segmentStart,
              end: segmentEnd,
            });
          }
          currentSpeaker = speaker;
          currentText = word.text;
          segmentStart = word.start || 0;
        } else {
          currentText += word.text;
        }
        segmentEnd = word.end || 0;
      }

      if (currentText.trim()) {
        segments.push({
          speaker: currentSpeaker,
          text: currentText.trim(),
          start: segmentStart,
          end: segmentEnd,
        });
      }
    }

    return new Response(JSON.stringify({ 
      text: transcription.text,
      segments,
      words: transcription.words || [],
    }), {
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
