import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VoiceCommandResult {
  command: string;
  confidence: number;
  action?: string;
}

export function useVoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start voice listening:", err);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(audioBlob);
        const audioBase64 = await base64Promise;

        const { data, error } = await supabase.functions.invoke("voice-transcribe", {
          body: { audio: audioBase64 },
        });

        if (error) throw error;

        const result: VoiceCommandResult = {
          command: data?.text || "",
          confidence: data?.confidence || 0,
          action: data?.action,
        };

        setLastCommand(result);
        return result;
      } catch (err) {
        console.error("Voice command processing failed:", err);
        toast({
          title: "Erro",
          description: "Falha ao processar comando de voz.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [toast]
  );

  return {
    isListening,
    isProcessing,
    lastCommand,
    startListening,
    stopListening,
  };
}
