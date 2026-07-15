export interface QueueMetricsSettings {
  id: string;
  enabled: boolean;
  avg_wait_time_warning: number;
  avg_wait_time_critical: number;
  abandonment_rate_warning: number;
  abandonment_rate_critical: number;
  service_level_warning: number;
  service_level_critical: number;
  check_interval_minutes: number;
}

export type UpdateSetting = <K extends keyof QueueMetricsSettings>(
  key: K,
  value: QueueMetricsSettings[K],
) => void;
