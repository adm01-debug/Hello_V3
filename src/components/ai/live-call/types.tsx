import { Angry, Frown, HelpCircle, Meh, Smile } from 'lucide-react';
import type { ReactNode } from 'react';

export interface RealtimeInsight {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  emotion: string;
  suggestion: string;
  keywords: string[];
  riskAlert: boolean;
  riskReason: string;
  timestamp: Date;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'agent' | 'customer';
  speakerLabel: string;
  timestamp: Date;
}

export const emotionIcons: Record<string, ReactNode> = {
  calmo: <Smile className="h-4 w-4 text-success" />,
  satisfeito: <Smile className="h-4 w-4 text-success" />,
  frustrado: <Meh className="h-4 w-4 text-warning" />,
  irritado: <Angry className="h-4 w-4 text-destructive" />,
  ansioso: <Frown className="h-4 w-4 text-warning" />,
  confuso: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
  neutro: <Meh className="h-4 w-4 text-muted-foreground" />,
};

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive':
      return 'text-success';
    case 'negative':
      return 'text-destructive';
    default:
      return 'text-warning';
  }
}

export function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'high':
      return 'bg-destructive text-destructive-foreground';
    case 'medium':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
