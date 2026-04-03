import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('CallRecording');

interface SaveRecordingOptions {
  callSessionId?: string;
  conferenceId?: string;
  participantCount?: number;
}

interface Recording {
  id: string;
  file_path: string;
  duration_seconds: number | null;
  recorded_at: string;
  participant_count: number | null;
}

export function useCallRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      return true;
    } catch {
      log.error('Failed to start recording');
      return false;
    }
  }, []);

  const stopAndSaveRecording = useCallback(async (options?: SaveRecordingOptions): Promise<string | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return null;
    setIsSaving(true);

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const fileName = `recording_${Date.now()}.webm`;
          const filePath = `recordings/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('call-recordings').upload(filePath, blob);
          if (uploadError) throw uploadError;
          await (supabase.from('call_recordings') as any).insert({
            file_path: filePath, call_session_id: options?.callSessionId || null,
            conference_id: options?.conferenceId || null, participant_count: options?.participantCount || null,
            duration_seconds: null, file_size_bytes: blob.size,
          });
          resolve(filePath);
        } catch (err) {
          log.error('Save failed', err);
          resolve(null);
        } finally {
          setIsRecording(false); setIsSaving(false);
          recorder.stream.getTracks().forEach((t) => t.stop());
        }
      };
      recorder.stop();
    });
  }, []);

  const getRecordings = useCallback(async (sessionOrConferenceId?: string): Promise<Recording[]> => {
    let query = (supabase.from('call_recordings') as any).select('*').order('recorded_at', { ascending: false });
    if (sessionOrConferenceId) query = query.or(`call_session_id.eq.${sessionOrConferenceId},conference_id.eq.${sessionOrConferenceId}`);
    const { data } = await query;
    return (data || []) as Recording[];
  }, []);

  const getRecordingUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const { data } = await supabase.storage.from('call-recordings').createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  }, []);

  return { isRecording, isSaving, startRecording, stopAndSaveRecording, getRecordings, getRecordingUrl };
}
