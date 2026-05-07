import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
 import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
 import { formatDuration } from "@/lib/utils";
import { logger } from '@/lib/logger';

interface WebRTCCallProps {
  targetNumber?: string;
  onCallStarted?: () => void;
  onCallEnded?: () => void;
}

type CallStatus = "idle" | "connecting" | "ringing" | "active" | "ended";

export function WebRTCCall({ targetNumber, onCallStarted, onCallEnded }: WebRTCCallProps) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      endCall();
    };
  }, []);

  const startCall = useCallback(async () => {
    try {
      setStatus("connecting");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected") {
          setStatus("active");
          onCallStarted?.();
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } else if (
          pc.iceConnectionState === "disconnected" ||
          pc.iceConnectionState === "failed"
        ) {
          endCall();
        }
      };

      peerConnectionRef.current = pc;
      setStatus("ringing");
    } catch (err) {
      logger.error("Failed to start WebRTC call:", err);
      setStatus("idle");
    }
  }, [onCallStarted]);

  const endCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    setStatus("ended");
    setDuration(0);
    setIsMuted(false);
    onCallEnded?.();

    setTimeout(() => setStatus("idle"), 2000);
  }, [onCallEnded]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const statusColors: Record<CallStatus, string> = {
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
          <Badge variant={statusColors[status] as any}>
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
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-3">
          {status === "idle" && (
            <Button onClick={startCall} className="bg-green-600 hover:bg-green-700">
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
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              >
                {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <Button variant="destructive" size="icon" onClick={endCall}>
                <PhoneOff className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
