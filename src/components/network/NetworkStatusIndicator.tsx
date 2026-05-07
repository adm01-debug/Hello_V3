 import { useNetworkMonitor } from "@/hooks/useNetworkMonitor";
 import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
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
 
   const getVariant = () => {
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
           variant={getVariant() as any} 
           className={cn(
             "gap-1.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider animate-in fade-in slide-in-from-right-2",
             status === 'unstable' && "animate-pulse"
           )}
         >
           {getIcon()}
           {getLabel()}
         </Badge>
       </TooltipTrigger>
       <TooltipContent side="bottom" className="text-xs">
         <p>Latência: {latencyMs ? `${latencyMs}ms` : 'N/A'}</p>
         <p>Último check: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString() : '-'}</p>
       </TooltipContent>
     </Tooltip>
   );
 }