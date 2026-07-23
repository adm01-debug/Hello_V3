import { useEffect, useRef } from 'react';
import { useBattleCardDetection } from '@/hooks/useBattleCardDetection';
import { BattleCardAlert } from '@/components/conversation-intelligence/BattleCardAlert';
import { useLiveTranscription } from './live-transcription/useLiveTranscription';
import { TranscriptionHeader } from './live-transcription/TranscriptionHeader';
import { TranscriptList } from './live-transcription/TranscriptList';
import type { TranscriptEntry } from './live-transcription/types';

interface LiveTranscriptionProps {
  isActive: boolean;
  onTranscript?: (transcript: TranscriptEntry) => void;
  callSessionId?: string;
  agentName?: string;
}

export function LiveTranscription({ isActive, onTranscript, callSessionId, agentName }: LiveTranscriptionProps) {
  const { activeCard, checkText, dismiss } = useBattleCardDetection(isActive);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    isRecording, isProcessing, transcripts, error, speakerStats, startRecording, stopRecording,
  } = useLiveTranscription({ onTranscript, onNewText: checkText });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcripts]);

  useEffect(() => {
    if (isActive && !isRecording) startRecording();
    else if (!isActive && isRecording) stopRecording();
  }, [isActive, isRecording, startRecording, stopRecording]);

  if (!isActive) return null;

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm">
      <TranscriptionHeader
        isRecording={isRecording}
        isProcessing={isProcessing}
        speakerStats={speakerStats}
        onStart={startRecording}
        onStop={stopRecording}
      />
      <TranscriptList ref={scrollRef} transcripts={transcripts} isRecording={isRecording} />
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
          {error}
        </div>
      )}
      <BattleCardAlert card={activeCard} onDismiss={dismiss} callSessionId={callSessionId} agentName={agentName} />
    </div>
  );
}
