import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    console.log('Received audio file:', audioFile.name, 'size:', audioFile.size, 'type:', audioFile.type);

    // Read the audio file as array buffer
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

    // Prepare form data for ElevenLabs
    const apiFormData = new FormData();
    apiFormData.append('file', audioBlob, 'recording.webm');
    apiFormData.append('model_id', 'scribe_v1');
    apiFormData.append('language_code', 'por'); // Portuguese
    apiFormData.append('diarize', 'true'); // Enable speaker diarization
    apiFormData.append('tag_audio_events', 'false');

    console.log('Sending to ElevenLabs with diarization enabled...');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const transcription = await response.json();
    console.log('Transcription result:', JSON.stringify(transcription));

    // Process words with speaker labels
    const segments: { speaker: string; text: string; start: number; end: number }[] = [];
    
    if (transcription.words && transcription.words.length > 0) {
      let currentSpeaker = transcription.words[0].speaker || 'speaker_0';
      let currentText = '';
      let segmentStart = transcription.words[0].start || 0;
      let segmentEnd = 0;

      for (const word of transcription.words) {
        const speaker = word.speaker || 'speaker_0';
        
        if (speaker !== currentSpeaker) {
          // Save current segment
          if (currentText.trim()) {
            segments.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              start: segmentStart,
              end: segmentEnd,
            });
          }
          // Start new segment
          currentSpeaker = speaker;
          currentText = word.text;
          segmentStart = word.start || 0;
        } else {
          currentText += word.text;
        }
        segmentEnd = word.end || 0;
      }

      // Add last segment
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
