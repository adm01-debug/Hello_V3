import { Radio, MessageCircle, Headphones } from 'lucide-react';
import type { CallChannel } from '@/hooks/useMultiChannelCall';

export const dialPadButtons = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export const channelIcons: Record<CallChannel, React.ComponentType<{ className?: string }>> = {
  webrtc: Radio,
  wavoip: MessageCircle,
  sip: Headphones,
};

export const channelColors: Record<CallChannel, string> = {
  webrtc: 'text-info',
  wavoip: 'text-success',
  sip: 'text-pending',
};

export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
