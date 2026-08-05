/**
 * Configuração central de ICE servers para WebRTC.
 * TURN opcional via env: VITE_TURN_URL, VITE_TURN_USER, VITE_TURN_CRED.
 */
export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: "stun:stun.cloudflare.com:3478" },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  const turnUser = import.meta.env.VITE_TURN_USER as string | undefined;
  const turnCred = import.meta.env.VITE_TURN_CRED as string | undefined;

  if (turnUrl && turnUser && turnCred) {
    servers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
  }

  return servers;
}

export const RECOMMENDED_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
