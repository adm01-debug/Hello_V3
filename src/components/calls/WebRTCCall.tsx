import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { getIceServers, RECOMMENDED_AUDIO_CONSTRAINTS } from "@/lib/webrtc-config";
import { useVoipQualityMonitor } from "@/hooks/useVoipQualityMonitor";
import { useAudioOutputDevices } from "@/hooks/useAudioOutputDevices";
import { CallQualityIndicator } from "@/components/calls/CallQualityIndicator";
import { WebRTCMetricsPanel } from "@/components/calls/WebRTCMetricsPanel";
import { AudioOutputSelector } from "@/components/calls/AudioOutputSelector";
import { PostCallSummary, type PostCallSummaryData } from "@/components/calls/PostCallSummary";


interface WebRTCCallProps {
  targetNumber?: string;
  callSessionId?: string | null;
  agentName?: string | null;
  onCallStarted?: () => void;
  onCallEnded?: () => void;
}

type CallStatus = "idle" | "connecting" | "ringing" | "active" | "ended";

export function WebRTCCall({
  targetNumber,
  callSessionId,
  agentName,
  onCallStarted,
  onCallEnded,
}: WebRTCCallProps) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [reconnect, setReconnect] = useState<{ attempt: number; max: number } | null>(null);
  const [summary, setSummary] = useState<PostCallSummaryData | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const disconnectGraceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callStartedAtRef = useRef<number | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const DISCONNECT_GRACE_MS = 3000;

  const quality = useVoipQualityMonitor(pc, {
    callSessionId: callSessionId ?? null,
    agentName: agentName ?? null,
    channel: "webrtc",
    persistOnEnd: true,
  });

  const clearReconnectTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (disconnectGraceRef.current) {
      clearTimeout(disconnectGraceRef.current);
      disconnectGraceRef.current = null;
    }
  }, []);

  const endCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearReconnectTimers();
    reconnectAttemptRef.current = 0;
    setReconnect(null);

    // Captura resumo ANTES de limpar samples/pc
    const samples = quality.getSamples();
    const endedAt = Date.now();
    const startedAt = callStartedAtRef.current ?? (samples[0]?.ts ?? endedAt);
    if (samples.length > 0) {
      setSummary({
        samples,
        durationSec: duration,
        targetNumber: targetNumber ?? null,
        channel: "webrtc",
        startedAt,
        endedAt,
      });
      setSummaryOpen(true);
    }
    callStartedAtRef.current = null;

    // Parar senders antes de fechar
    peerConnectionRef.current?.getSenders().forEach((s) => s.track?.stop());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setPc(null);

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setStatus("ended");
    setDuration(0);
    setIsMuted(false);
    onCallEnded?.();

    setTimeout(() => setStatus("idle"), 2000);
  }, [onCallEnded, clearReconnectTimers, quality, duration, targetNumber]);



  const scheduleReconnect = useCallback(
    (reason: string) => {
      const conn = peerConnectionRef.current;
      if (!conn) return;

      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        logger.error(`Reconexão abortada após ${MAX_RECONNECT_ATTEMPTS} tentativas (${reason})`);
        toast.error("Não foi possível restabelecer a chamada");
        endCall();
        return;
      }

      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(1000 * 2 ** (attempt - 1), 16000);
      setReconnect({ attempt, max: MAX_RECONNECT_ATTEMPTS });
      logger.warn(`Reconexão ${attempt}/${MAX_RECONNECT_ATTEMPTS} em ${delay}ms (${reason})`);
      toast.warning(`Reconectando (${attempt}/${MAX_RECONNECT_ATTEMPTS})…`);

      reconnectTimerRef.current = setTimeout(() => {
        try {
          conn.restartIce();
        } catch (err) {
          logger.error("ICE restart falhou:", err);
          endCall();
        }
      }, delay);
    },
    [endCall],
  );

  const startCall = useCallback(async () => {
    try {
      setStatus("connecting");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: RECOMMENDED_AUDIO_CONSTRAINTS,
      });
      localStreamRef.current = stream;

      const conn = new RTCPeerConnection({ iceServers: getIceServers() });

      // Transceiver bidirecional (padrão moderno)
      const transceiver = conn.addTransceiver("audio", { direction: "sendrecv" });
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        await transceiver.sender.replaceTrack(audioTrack);
      }

      conn.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteAudioRef.current && remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
          void remoteAudioRef.current.play().catch((err) => {
            logger.warn("Auto-play do áudio remoto bloqueado:", err);
          });
        }
      };

      conn.oniceconnectionstatechange = () => {
        const state = conn.iceConnectionState;
        if (state === "connected" || state === "completed") {
          clearReconnectTimers();
          reconnectAttemptRef.current = 0;
          setReconnect(null);
          setStatus("active");
          onCallStarted?.();
          if (callStartedAtRef.current === null) {
            callStartedAtRef.current = Date.now();
          }
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
          }
        } else if (state === "disconnected") {
          logger.warn("ICE desconectado — grace period antes de reconectar");
          if (!disconnectGraceRef.current) {
            disconnectGraceRef.current = setTimeout(() => {
              disconnectGraceRef.current = null;
              if (
                conn.iceConnectionState === "disconnected" ||
                conn.iceConnectionState === "failed"
              ) {
                scheduleReconnect("ice-disconnected");
              }
            }, DISCONNECT_GRACE_MS);
          }
        } else if (state === "failed") {
          scheduleReconnect("ice-failed");
        }
      };

      conn.onconnectionstatechange = () => {
        if (conn.connectionState === "failed") {
          scheduleReconnect("connection-failed");
        } else if (conn.connectionState === "closed") {
          endCall();
        }
      };

      peerConnectionRef.current = conn;
      setPc(conn);
      setStatus("ringing");
    } catch (err) {
      const error = err as DOMException;
      logger.error("Falha ao iniciar chamada WebRTC:", err);
      if (error.name === "NotAllowedError") {
        toast.error("Permissão de microfone negada");
      } else if (error.name === "NotFoundError") {
        toast.error("Nenhum microfone encontrado");
      } else {
        toast.error("Falha ao iniciar chamada");
      }
      setStatus("idle");
    }
  }, [onCallStarted, endCall]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    tracks.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted(tracks[0] ? !tracks[0].enabled : false);
  }, []);

  const audioOutput = useAudioOutputDevices(remoteAudioRef);

  // Sincroniza estado de mute/speaker com o elemento de áudio remoto.
  useEffect(() => {
    const audio = remoteAudioRef.current;
    if (!audio) return;
    audio.muted = !isSpeakerOn;
  }, [isSpeakerOn]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);



  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (disconnectGraceRef.current) clearTimeout(disconnectGraceRef.current);
      peerConnectionRef.current?.getSenders().forEach((s) => s.track?.stop());
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
    };
  }, []);

  const statusColors: Record<CallStatus, BadgeProps["variant"]> = {
    idle: "secondary",
    connecting: "outline",
    ringing: "outline",
    active: "default",
    ended: "destructive",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">WebRTC Call</CardTitle>
          <Badge variant={statusColors[status]}>
            {status === "idle" && "Pronto"}
            {status === "connecting" && "Conectando..."}
            {status === "ringing" && "Chamando..."}
            {status === "active" && formatDuration(duration)}
            {status === "ended" && "Encerrada"}
          </Badge>
        </div>
        {targetNumber && (
          <p className="text-sm text-muted-foreground">{targetNumber}</p>
        )}
        {status === "active" && (
          <div className="pt-2">
            <CallQualityIndicator quality={quality} />
          </div>
        )}
        {reconnect && (
          <p className="pt-2 text-xs text-warning" role="status" aria-live="polite">
            Reconectando… tentativa {reconnect.attempt} de {reconnect.max}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        {status === "active" && <WebRTCMetricsPanel quality={quality} />}
        <AudioOutputSelector
          supported={audioOutput.supported}
          devices={audioOutput.devices}
          selectedSinkId={audioOutput.selectedSinkId}
          onChange={audioOutput.setSinkId}
          disabled={!isSpeakerOn}
        />
        <div className="flex items-center justify-center gap-3">
          {status === "idle" && (
            <Button
              onClick={startCall}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
          )}

          {(status === "active" || status === "ringing" || status === "connecting") && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                className={isMuted ? "text-destructive" : ""}
                aria-label={isMuted ? "Ativar microfone" : "Silenciar microfone"}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSpeaker}
                aria-label={isSpeakerOn ? "Silenciar alto-falante" : "Ativar alto-falante"}
              >
                {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <Button variant="destructive" size="icon" onClick={endCall} aria-label="Encerrar">
                <PhoneOff className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
