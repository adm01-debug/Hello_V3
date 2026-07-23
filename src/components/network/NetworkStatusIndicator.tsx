import { safeToLocaleTimeString } from "@/lib/safe-date";
 import { useNetworkMonitor } from "@/hooks/useNetworkMonitor";
 import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
 import { Badge, type BadgeProps } from "@/components/ui/badge";
 import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
 import { cn } from "@/lib/utils";
 
 export function NetworkStatusIndicator() {
   const { status, latencyMs, lastCheckedAt } = useNetworkMonitor();
 
   if (status === 'online' && (latencyMs || 0) < 150) return null;
 
   const getIcon = () => {
     switch (status) {
       case 'offline': return <WifiOff className="h-3 w-3" />;
       case 'unstable': return <AlertTriangle className="h-3 w-3" />;
       default: return <Wifi className="h-3 w-3" />;
     }
   };
 
   const getLabel = () => {
     switch (status) {
       case 'offline': return 'Offline';
       case 'unstable': return 'Instável';
       case 'checking': return 'Checando...';
       default: return `${latencyMs}ms`;
     }
   };
 
   const getVariant = (): BadgeProps['variant'] => {
     switch (status) {
       case 'offline': return 'destructive';
       case 'unstable': return 'warning';
       default: return 'outline';
     }
   };
 
   return (
     <Tooltip>
       <TooltipTrigger asChild>
          <Badge 
            variant={getVariant()}
            className={cn(
              "gap-1.5 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all duration-300",
              status === 'unstable' && "animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]",
              status === 'offline' && "shadow-[0_0_10px_rgba(239,68,68,0.5)]",
              "animate-in fade-in slide-in-from-right-2"
            )}
          >
            {getIcon()}
            {getLabel()}
          </Badge>
       </TooltipTrigger>
       <TooltipContent side="bottom" className="text-xs">
         <p>Latência: {latencyMs ? `${latencyMs}ms` : 'N/A'}</p>
         <p>Último check: {lastCheckedAt ? safeToLocaleTimeString(lastCheckedAt) : '-'}</p>
       </TooltipContent>
     </Tooltip>
   );
 }