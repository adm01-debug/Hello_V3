import { useTrunkFailoverMonitor } from "@/hooks/useTrunkFailoverMonitor";
import { useQualityAlerts } from "@/hooks/useQualityAlerts";

export function GlobalServices() {
  useTrunkFailoverMonitor();
  useQualityAlerts();
  return null;
}
