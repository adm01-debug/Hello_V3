import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId, filePath } = await req.json();
    
    if (!recordingId || !filePath) {
      throw new Error('recordingId and filePath are required');
    }

    console.log(`Starting transcription for recording: ${recordingId}, file: ${filePath}`);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Create Supabase client with service role for storage access
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Download the audio file from storage
    console.log('Downloading audio file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('call-recordings')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      throw new Error(`Failed to download audio file: ${downloadError?.message || 'Unknown error'}`);
    }

    console.log(`Downloaded file, size: ${fileData.size} bytes`);

    // Prepare form data for ElevenLabs API
    const formData = new FormData();
    formData.append('file', fileData, 'recording.webm');
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', 'por'); // Portuguese
    formData.append('diarize', 'true'); // Enable speaker identification
    formData.append('tag_audio_events', 'true');

    console.log('Sending to ElevenLabs for transcription...');

    // Send to ElevenLabs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const transcription = await response.json();
    console.log('Transcription received successfully');

    // Get the recording to find associated call_session_id
    const { data: recording, error: recordingError } = await supabase
      .from('call_recordings')
      .select('call_session_id')
      .eq('id', recordingId)
      .maybeSingle();

    if (recordingError) {
      console.error('Error fetching recording:', recordingError);
    }

    // Save transcription to database if we have a call_session_id
    if (recording?.call_session_id && transcription.words) {
      console.log('Saving transcription to database...');
      
      // Group words by speaker for better readability
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
          currentStartTime = word.start;
        }
        
        currentSpeaker = speaker;
        currentText += word.text + ' ';
      }

      // Add last segment
      if (currentText) {
        transcriptionEntries.push({
          call_session_id: recording.call_session_id,
          speaker: currentSpeaker || 'Speaker',
          text: currentText.trim(),
          start_time: currentStartTime,
          end_time: transcription.words[transcription.words.length - 1]?.end || 0,
        });
      }

      // Insert transcription entries
      if (transcriptionEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('call_transcriptions')
          .insert(transcriptionEntries);

        if (insertError) {
          console.error('Error saving transcription:', insertError);
        } else {
          console.log(`Saved ${transcriptionEntries.length} transcription segments`);
        }
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
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
