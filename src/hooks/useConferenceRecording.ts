import { useCallback, useEffect, useRef } from 'react';
import { useCallRecording } from './useCallRecording';
import { ConferenceCall } from './useMultiChannelCall';

interface UseConferenceRecordingProps {
  conference: ConferenceCall | null;
  onRecordingStarted?: () => void;
  onRecordingSaved?: (filePath: string) => void;
}

export function useConferenceRecording({
  conference,
  onRecordingStarted,
  onRecordingSaved
}: UseConferenceRecordingProps) {
  const {
    isRecording,
    isSaving,
    startRecording,
    stopAndSaveRecording,
    getRecordings,
    getRecordingUrl
  } = useCallRecording();

  const wasRecordingRef = useRef(false);
  const conferenceIdRef = useRef<string | null>(null);

  // Auto-start recording when conference starts with isRecording=true
  useEffect(() => {
    if (conference?.isRecording && conference.isActive && !isRecording && !wasRecordingRef.current) {
      console.log('[ConferenceRecording] Auto-starting recording for conference:', conference.id);
      conferenceIdRef.current = conference.id;
      wasRecordingRef.current = true;
      startRecording().then((success) => {
        if (success) {
          onRecordingStarted?.();
        }
      });
    }
  }, [conference?.isRecording, conference?.isActive, conference?.id, isRecording, startRecording, onRecordingStarted]);

  // Auto-save when conference ends
  useEffect(() => {
    if (wasRecordingRef.current && (!conference || !conference.isActive)) {
      console.log('[ConferenceRecording] Conference ended, saving recording');
      const confId = conferenceIdRef.current;
      wasRecordingRef.current = false;
      
      stopAndSaveRecording({
        conferenceId: confId || undefined,
        participantCount: conference?.participantIds?.length || 2
      }).then((filePath) => {
        if (filePath) {
          onRecordingSaved?.(filePath);
        }
        conferenceIdRef.current = null;
      });
    }
  }, [conference, stopAndSaveRecording, onRecordingSaved]);

  // Manual stop and save
  const saveConferenceRecording = useCallback(async () => {
    if (!conference) return null;
    
    const filePath = await stopAndSaveRecording({
      conferenceId: conference.id,
      participantCount: conference.participantIds.length
    });
    
    wasRecordingRef.current = false;
    return filePath;
  }, [conference, stopAndSaveRecording]);

  // Get recordings for current conference
  const getConferenceRecordings = useCallback(async () => {
    if (!conference) return [];
    return getRecordings(conference.id);
  }, [conference, getRecordings]);

  return {
    isRecording,
    isSaving,
    saveConferenceRecording,
    getConferenceRecordings,
    getRecordingUrl
  };
}