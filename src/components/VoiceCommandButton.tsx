import { useState, useCallback, useMemo } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceCommandButtonProps {
  onVoiceCommand: (command: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceCommandButton({ 
  onVoiceCommand, 
  disabled = false,
  className 
}: VoiceCommandButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: Check if browser supports speech recognition
  const speechRecognitionSupported = useMemo(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);

  // Helper: Get SpeechRecognition constructor
  const getSpeechRecognition = useCallback(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    return SpeechRecognition;
  }, []);

  // Helper: Handle voice recognition
  const handleVoiceRecognition = useCallback(async () => {
    if (!speechRecognitionSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setError(null);
    setIsListening(true);

    try {
      const SpeechRecognition = getSpeechRecognition();
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript;
        setIsListening(false);
        setIsProcessing(true);
        
        onVoiceCommand(command);
        
        setTimeout(() => setIsProcessing(false), 1000);
      };

      recognition.onerror = (event: any) => {
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setError('Failed to start voice recognition');
      setIsListening(false);
    }
  }, [speechRecognitionSupported, getSpeechRecognition, onVoiceCommand]);

  // Helper: Get button label for accessibility
  const getAriaLabel = useCallback(() => {
    if (isProcessing) return 'Processing voice command';
    if (isListening) return 'Listening to voice command, speak now';
    return 'Activate voice command';
  }, [isProcessing, isListening]);

  // Helper: Get button icon
  const ButtonIcon = useMemo(() => {
    if (isProcessing) return Loader2;
    if (isListening) return MicOff;
    return Mic;
  }, [isProcessing, isListening]);

  // Helper: Get button variant
  const buttonVariant = useMemo(() => {
    if (isListening) return 'destructive' as const;
    return 'default' as const;
  }, [isListening]);

  // Helper: Check if button should be disabled
  const isButtonDisabled = useMemo(() => {
    return disabled || !speechRecognitionSupported || isProcessing;
  }, [disabled, speechRecognitionSupported, isProcessing]);

  // Helper: Get status text
  const statusText = useMemo(() => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    if (error) return error;
    if (!speechRecognitionSupported) return 'Not supported';
    return 'Ready';
  }, [isProcessing, isListening, error, speechRecognitionSupported]);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button
        onClick={handleVoiceRecognition}
        disabled={isButtonDisabled}
        variant={buttonVariant}
        size="lg"
        className="relative"
        aria-label={getAriaLabel()}
        aria-live="polite"
        aria-busy={isProcessing || isListening}
      >
        <ButtonIcon 
          className={cn(
            'h-5 w-5',
            isProcessing && 'animate-spin'
          )} 
          aria-hidden="true"
        />
        <span className="ml-2">{statusText}</span>
      </Button>

      {error && (
        <p 
          className="text-sm text-destructive" 
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default VoiceCommandButton;
