import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecordingMetadata {
  conferenceId?: string;
  callSessionId?: string;
  participantCount?: number;
}

export function useCallRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<Date | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      // Get audio stream from user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = new Date();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      console.log('[Recording] Started audio recording');
      return true;
    } catch (error) {
      console.error('[Recording] Failed to start:', error);
      toast.error('Não foi possível iniciar a gravação');
      return false;
    }
  }, []);

  // Stop recording and return the audio blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        setIsRecording(false);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        console.log('[Recording] Stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  // Save recording to Supabase Storage
  const saveRecording = useCallback(async (
    audioBlob: Blob,
    metadata: RecordingMetadata
  ): Promise<string | null> => {
    if (!audioBlob || audioBlob.size === 0) {
      console.error('[Recording] No audio data to save');
      return null;
    }

    setIsSaving(true);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = metadata.conferenceId 
        ? `conference-${metadata.conferenceId}-${timestamp}.webm`
        : `call-${metadata.callSessionId || 'unknown'}-${timestamp}.webm`;
      
      const filePath = `recordings/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error('[Recording] Upload failed:', uploadError);
        throw uploadError;
      }

      // Calculate duration
      const durationSeconds = recordingStartTimeRef.current
        ? Math.floor((new Date().getTime() - recordingStartTimeRef.current.getTime()) / 1000)
        : 0;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('call_recordings')
        .insert({
          call_session_id: metadata.callSessionId || null,
          conference_id: metadata.conferenceId || null,
          file_path: filePath,
          file_size_bytes: audioBlob.size,
          duration_seconds: durationSeconds,
          participant_count: metadata.participantCount || 1,
          recorded_at: recordingStartTimeRef.current?.toISOString() || new Date().toISOString()
        });

      if (dbError) {
        console.error('[Recording] DB insert failed:', dbError);
        // Don't throw, recording is saved even if metadata fails
      }

      console.log('[Recording] Saved successfully:', filePath);
      toast.success('Gravação salva com sucesso');
      
      return filePath;
    } catch (error) {
      console.error('[Recording] Save failed:', error);
      toast.error('Erro ao salvar gravação');
      return null;
    } finally {
      setIsSaving(false);
      recordingStartTimeRef.current = null;
    }
  }, []);

  // Stop and save in one operation
  const stopAndSaveRecording = useCallback(async (metadata: RecordingMetadata) => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      return saveRecording(audioBlob, metadata);
    }
    return null;
  }, [stopRecording, saveRecording]);

  // Get list of recordings
  const getRecordings = useCallback(async (conferenceId?: string) => {
    try {
      let query = supabase
        .from('call_recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (conferenceId) {
        query = query.eq('conference_id', conferenceId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Recording] Failed to fetch recordings:', error);
      return [];
    }
  }, []);

  // Get download URL for a recording
  const getRecordingUrl = useCallback(async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('call-recordings')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('[Recording] Failed to get URL:', error);
      return null;
    }
  }, []);

  return {
    isRecording,
    isSaving,
    startRecording,
    stopRecording,
    saveRecording,
    stopAndSaveRecording,
    getRecordings,
    getRecordingUrl
  };
}