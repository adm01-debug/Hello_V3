import { Bell, Phone, Shield, Bot, Trophy, Settings2 } from 'lucide-react';
import type { ElementType } from 'react';

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  severity: string;
  is_read: boolean;
  is_archived: boolean;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, unknown> | null;
  source_type: string | null;
  source_id: string | null;
  expires_at: string | null;
  read_at: string | null;
  created_at: string;
};

export const categoryIcons: Record<string, ElementType> = {
  system: Settings2,
  call: Phone,
  security: Shield,
  coaching: Bot,
  gamification: Trophy,
};

export const categoryLabels: Record<string, string> = {
  system: 'Sistema',
  call: 'Chamadas',
  security: 'Segurança',
  coaching: 'Coaching',
  gamification: 'Gamificação',
};

export const severityColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-warning/20 text-warning',
  info: 'bg-primary/15 text-primary',
  success: 'bg-emerald-500/15 text-emerald-600',
};

export const fallbackIcon = Bell;
