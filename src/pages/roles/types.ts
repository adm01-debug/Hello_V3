import { Crown, Shield, User, Eye } from 'lucide-react';

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  granted_by?: string | null;
  user_email?: string;
  user_name?: string | null;
  [key: string]: unknown;
}

export const ROLE_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: { label: 'Administrador', icon: Crown, color: 'bg-destructive' },
  supervisor: { label: 'Supervisor', icon: Shield, color: 'bg-info' },
  agent: { label: 'Agente', icon: User, color: 'bg-success' },
  viewer: { label: 'Visualizador', icon: Eye, color: 'bg-muted-foreground' },
};
