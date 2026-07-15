import type { ReactNode } from 'react';
import {
  Activity, AlertTriangle, CheckCircle, XCircle, Clock, Monitor, Zap, Loader2, Gauge,
} from 'lucide-react';

export const vitalConfig: Record<string, { label: string; unit: string; icon: ReactNode }> = {
  LCP: { label: 'Largest Contentful Paint', unit: 'ms', icon: <Monitor className="h-4 w-4" /> },
  FID: { label: 'First Input Delay', unit: 'ms', icon: <Zap className="h-4 w-4" /> },
  CLS: { label: 'Cumulative Layout Shift', unit: '', icon: <Activity className="h-4 w-4" /> },
  FCP: { label: 'First Contentful Paint', unit: 'ms', icon: <Gauge className="h-4 w-4" /> },
  TTFB: { label: 'Time to First Byte', unit: 'ms', icon: <Clock className="h-4 w-4" /> },
  INP: { label: 'Interaction to Next Paint', unit: 'ms', icon: <Zap className="h-4 w-4" /> },
};

export const ratingColors: Record<string, string> = {
  good: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  'needs-improvement': 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  poor: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const statusIcons: Record<string, ReactNode> = {
  healthy: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  degraded: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  down: <XCircle className="h-5 w-5 text-destructive" />,
  checking: <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />,
};

export interface LoadTestStats {
  insert_latency_avg_ms: number;
  select_latency_ms: number;
  total_duration_ms: number;
  records_processed: number;
}
