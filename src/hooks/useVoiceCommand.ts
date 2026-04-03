import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const log = logger.create("VoiceCommand");

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

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => { resolve((reader.result as string).split(",")[1]); };
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;
      const { data, error } = await supabase.functions.invoke("voice-transcribe", { body: { audio: audioBase64 } });
      if (error) throw error;
      const result: VoiceCommandResult = { command: data?.text || "", confidence: data?.confidence || 0, action: data?.action };
      setLastCommand(result);
      return result;
    } catch (err) {
      log.error("Voice command processing failed", err);
      toast.error("Erro", { description: "Falha ao processar comando de voz." });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await processAudio(audioBlob);
      };
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      log.error("Failed to start voice listening", err);
      toast.error("Erro", { description: "Não foi possível acessar o microfone." });
    }
  }, [processAudio]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setIsListening(false);
  }, []);

  return { isListening, isProcessing, lastCommand, startListening, stopListening };
}
