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
import { CallQualityIndicator } from "@/components/calls/CallQualityIndicator";

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

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const quality = useVoipQualityMonitor(pc, {
    callSessionId: callSessionId ?? null,
    agentName: agentName ?? null,
    channel: "webrtc",
    persistOnEnd: true,
  });

  const endCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

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
  }, [onCallEnded]);

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
        if (conn.iceConnectionState === "connected") {
          setStatus("active");
          onCallStarted?.();
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
          }
        } else if (conn.iceConnectionState === "disconnected") {
          logger.warn("ICE desconectado — aguardando reconexão");
        }
      };

      conn.onconnectionstatechange = () => {
        if (conn.connectionState === "failed") {
          logger.warn("Conexão falhou — tentando ICE restart");
          try {
            conn.restartIce();
          } catch (err) {
            logger.error("ICE restart falhou:", err);
            endCall();
          }
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

  const toggleSpeaker = useCallback(async () => {
    const audio = remoteAudioRef.current;
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    if (!audio) return;
    audio.muted = !next;
    // Se o browser suportar setSinkId, alterna para default/none
    const audioEl = audio as HTMLAudioElement & {
      setSinkId?: (id: string) => Promise<void>;
    };
    if (typeof audioEl.setSinkId === "function") {
      try {
        await audioEl.setSinkId(next ? "default" : "");
      } catch (err) {
        logger.warn("setSinkId não suportado ou falhou:", err);
      }
    }
  }, [isSpeakerOn]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
      </CardHeader>
      <CardContent>
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
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
