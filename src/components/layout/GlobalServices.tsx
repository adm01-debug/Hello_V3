import { useTrunkFailoverMonitor } from "@/hooks/useTrunkFailoverMonitor";

export function GlobalServices() {
  useTrunkFailoverMonitor();
  return null;
}
