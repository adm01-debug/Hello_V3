 import { useState, useMemo } from 'react';
 import {
   Bell, BellRing, Settings2, Users, Phone,
   Check, Trash2, ChevronRight, RefreshCw, Loader2,
   FlaskConical, ExternalLink, type LucideIcon
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from '@/components/ui/popover';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { formatDistanceToNow } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { useRealtimeHoldAlerts } from '@/hooks/useRealtimeHoldAlerts';
 import { useContactAlerts } from '@/hooks/useContactAlerts';
 import { useAlerts } from '@/hooks/useAlerts';
 import { useNavigate } from 'react-router-dom';
 import { cn } from '@/lib/utils';
 
 export function UnifiedNotificationDropdown() {
   const navigate = useNavigate();
   const [open, setOpen] = useState(false);
   
   // System Alerts (from useRealtimeHoldAlerts)
   const systemAlerts = useRealtimeHoldAlerts();
   
   // Call & Contact Alerts
   const allAlerts = useAlerts();
 
   const totalUnread = useMemo(() => {
     return systemAlerts.unreadCount + allAlerts.callUnreadCount + allAlerts.contactUnreadCount;
   }, [systemAlerts.unreadCount, allAlerts.callUnreadCount, allAlerts.contactUnreadCount]);
 
   return (
     <Popover open={open} onOpenChange={setOpen}>
       <PopoverTrigger asChild>
         <Button 
           variant="ghost" 
           size="icon" 
           className="relative hover:bg-primary/10 transition-all group"
           aria-label={`Notificações${totalUnread > 0 ? ` - ${totalUnread} não lidas` : ''}`}
         >
           {totalUnread > 0 ? (
             <BellRing className="h-5 w-5 animate-pulse text-primary group-hover:scale-110 transition-transform" />
           ) : (
             <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
           )}
           {totalUnread > 0 && (
             <Badge 
               className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0.5 text-[10px] bg-destructive border-2 border-background"
             >
               {totalUnread > 99 ? '99+' : totalUnread}
             </Badge>
           )}
         </Button>
       </PopoverTrigger>
       <PopoverContent className="w-[400px] p-0 glass-neon border-primary/20 shadow-2xl" align="end">
         <div className="flex items-center justify-between border-b border-border/30 p-4 bg-muted/30">
           <div>
             <h4 className="font-bold text-lg tracking-tight">Notificações</h4>
             <p className="text-xs text-muted-foreground">{totalUnread} alertas pendentes</p>
           </div>
           <div className="flex gap-1">
             <Button 
               variant="ghost" 
               size="sm" 
               className="h-8 text-xs hover:bg-primary/10"
               onClick={async () => {
                 await systemAlerts.markAllAsRead();
                 await allAlerts.markAllCallAlertsAsRead();
                 // useAlerts doesn't have markAllContactAlertsAsRead yet, but we can do batch
                 await allAlerts.batchMarkContactAlertsAsRead();
               }}
             >
               <Check className="h-3.5 w-3.5 mr-1" /> Marcar lidos
             </Button>
           </div>
         </div>
 
         <Tabs defaultValue="system" className="w-full">
           <TabsList className="w-full grid grid-cols-3 bg-muted/20 border-b border-border/30 h-11 rounded-none p-0">
             <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 gap-2 text-xs">
               <Settings2 className="h-3.5 w-3.5" />
               Sistema
               {systemAlerts.unreadCount > 0 && (
                 <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{systemAlerts.unreadCount}</Badge>
               )}
             </TabsTrigger>
             <TabsTrigger value="calls" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 gap-2 text-xs">
               <Phone className="h-3.5 w-3.5" />
               Chamadas
               {allAlerts.callUnreadCount > 0 && (
                 <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{allAlerts.callUnreadCount}</Badge>
               )}
             </TabsTrigger>
             <TabsTrigger value="contacts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 gap-2 text-xs">
               <Users className="h-3.5 w-3.5" />
               Contatos
               {allAlerts.contactUnreadCount > 0 && (
                 <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{allAlerts.contactUnreadCount}</Badge>
               )}
             </TabsTrigger>
           </TabsList>
 
           <ScrollArea className="h-[400px]">
             <TabsContent value="system" className="m-0 p-2 space-y-2">
               {systemAlerts.recentAlerts.length === 0 ? (
                 <EmptyState icon={Settings2} message="Nenhum alerta de sistema" />
               ) : (
                 systemAlerts.recentAlerts.map(alert => (
                   <NotificationItem 
                     key={alert.id}
                     title="Alerta de Sistema"
                     message={alert.message}
                     time={alert.created_at}
                     isRead={alert.is_read}
                     severity={alert.severity}
                     onRead={() => systemAlerts.markAllAsRead()} // Basic mark all as read for system for now
                   />
                 ))
               )}
             </TabsContent>
 
             <TabsContent value="calls" className="m-0 p-2 space-y-2">
               {allAlerts.callAlerts.length === 0 ? (
                 <EmptyState icon={Phone} message="Nenhum alerta de chamada" />
               ) : (
                 allAlerts.callAlerts.map((alert) => (
                   <NotificationItem 
                     key={alert.id}
                     title={alert.title}
                     message={alert.message}
                     time={alert.created_at}
                     isRead={alert.is_read}
                     severity={alert.severity}
                     onRead={() => allAlerts.markCallAlertAsRead(alert.id)}
                   />
                 ))
               )}
             </TabsContent>
 
             <TabsContent value="contacts" className="m-0 p-2 space-y-2">
               {allAlerts.contactAlerts.length === 0 ? (
                 <EmptyState icon={Users} message="Nenhum alerta de contatos" />
               ) : (
                 allAlerts.contactAlerts.map((alert) => (
                   <NotificationItem 
                     key={alert.id}
                     title={alert.title}
                     message={alert.message}
                     time={alert.created_at}
                     isRead={alert.is_read}
                     severity={alert.severity}
                     onRead={() => allAlerts.markContactAlertAsRead(alert.id)}
                     onClick={() => {
                       allAlerts.markContactAlertAsRead(alert.id);
                       setOpen(false);
                       navigate('/contacts');
                     }}
                   />
                 ))
               )}
             </TabsContent>
           </ScrollArea>
         </Tabs>
 
         <div className="border-t border-border/30 p-3 flex items-center justify-between bg-muted/20">
           <Button 
             variant="ghost" 
             size="sm" 
             className="text-xs gap-1 hover:text-primary transition-colors"
             onClick={() => {
               setOpen(false);
               navigate('/notifications');
             }}
           >
             <ExternalLink className="h-3 w-3" />
             Ver histórico completo
           </Button>
           
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-auto p-1 text-[10px] text-muted-foreground hover:text-foreground"
             onClick={async (e) => {
               e.preventDefault();
               await allAlerts.fetchAllAlerts();
             }}
           >
             <RefreshCw className="h-3 w-3 mr-1" />
             Sincronizar
           </Button>
         </div>
       </PopoverContent>
     </Popover>
   );
 }
 
 interface NotificationItemProps {
   title: string;
   message: string;
   time: string;
   isRead: boolean;
   severity: string;
   onRead: () => void;
   onClick?: () => void;
 }

 function NotificationItem({ title, message, time, isRead, severity, onRead, onClick }: NotificationItemProps) {
   const getSeverityColor = (sev: string) => {
     switch (sev) {
       case 'critical':
       case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
       case 'warning': return 'bg-warning/10 text-warning border-warning/20';
       case 'success': return 'bg-success/10 text-success border-success/20';
       default: return 'bg-primary/10 text-primary border-primary/20';
     }
   };
 
   return (
     <div 
       className={cn(
         "flex flex-col gap-1 p-3 rounded-lg border border-border/40 transition-all hover:border-primary/30 cursor-pointer relative overflow-hidden group",
         !isRead ? "bg-primary/5" : "bg-card"
       )}
       onClick={onClick || onRead}
     >
       {!isRead && (
         <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary" />
       )}
       <div className="flex items-center justify-between gap-2">
         <div className="flex items-center gap-2">
           <Badge className={cn("text-[10px] h-4 px-1.5 font-bold uppercase", getSeverityColor(severity))}>
             {severity}
           </Badge>
           <span className={cn("text-sm font-semibold truncate", !isRead ? "text-foreground" : "text-muted-foreground")}>
             {title}
           </span>
         </div>
         <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
           {formatDistanceToNow(new Date(time), { addSuffix: true, locale: ptBR })}
         </span>
       </div>
       <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
         {message}
       </p>
       <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
         {!isRead && (
           <Button variant="ghost" size="sm" className="h-6 text-[10px] p-1 gap-1" onClick={(e) => { e.stopPropagation(); onRead(); }}>
             <Check className="h-3 w-3" /> Marcar como lido
           </Button>
         )}
       </div>
     </div>
   );
 }
 
 function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
   return (
     <div className="flex flex-col items-center justify-center py-12 text-center">
       <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
         <Icon className="h-6 w-6 text-muted-foreground/40" />
       </div>
       <p className="text-sm text-muted-foreground font-medium">{message}</p>
     </div>
   );
 }