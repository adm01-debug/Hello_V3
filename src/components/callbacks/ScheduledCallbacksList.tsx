import { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  User, 
  Calendar,
  Clock,
  Check,
  X,
  Trash2,
  Bell,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, isPast, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useScheduledCallbacks, ScheduledCallback } from '@/hooks/useScheduledCallbacks';
import { ScheduleCallbackDialog } from './ScheduleCallbackDialog';
import { toast } from 'sonner';
import { safeFormatDatePtBR } from "@/lib/safe-date";

export function ScheduledCallbacksList() {
  const { 
    callbacks, 
    isLoading, 
    fetchCallbacks,
    completeCallback, 
    cancelCallback,
    deleteCallback 
  } = useScheduledCallbacks();
  
  const [activeTab, setActiveTab] = useState('pending');
  const notifiedCallbacks = useRef<Set<string>>(new Set());

  // Check for upcoming callbacks and notify
  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      callbacks.forEach(callback => {
        if (callback.status !== 'pending') return;
        
        const scheduledAt = new Date(callback.scheduled_at);
        const minutesUntil = differenceInMinutes(scheduledAt, now);
        
        // Notify 5 minutes before
        if (minutesUntil <= 5 && minutesUntil > 0 && !notifiedCallbacks.current.has(callback.id)) {
          notifiedCallbacks.current.add(callback.id);
          
          // Play notification sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVq');
          audio.volume = 0.5;
          audio.play().catch(() => {});
          
          toast.warning(
            `Callback em ${minutesUntil} minutos!`,
            {
              description: `${callback.caller_name} - ${callback.caller_phone}`,
              duration: 10000,
              action: {
                label: 'Ligar',
                onClick: () => handleCall(callback)
              }
            }
          );
        }
      });
    };

    const interval = setInterval(checkUpcoming, 30000);
    checkUpcoming();

    return () => clearInterval(interval);
  }, [callbacks]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'all') {
      fetchCallbacks();
    } else {
      fetchCallbacks(tab);
    }
  };

  const handleCall = (callback: ScheduledCallback) => {
    toast.info(`Iniciando chamada para ${callback.caller_phone}...`);
    // Here you would integrate with the actual call system
  };

  const handleComplete = async (callback: ScheduledCallback) => {
    await completeCallback(callback.id);
  };

  const handleCancel = async (callback: ScheduledCallback) => {
    await cancelCallback(callback.id);
  };

  const handleDelete = async (callback: ScheduledCallback) => {
    await deleteCallback(callback.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-warning text-warning-foreground';
      case 'normal':
        return 'bg-muted text-muted-foreground';
      case 'low':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgent: 'Urgente',
      high: 'Alta',
      normal: 'Normal',
      low: 'Baixa'
    };
    return labels[priority] || priority;
  };

  const getTimeStatus = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    const now = new Date();
    const minutesUntil = differenceInMinutes(date, now);

    if (isPast(date)) {
      return { status: 'overdue', label: 'Atrasado', color: 'text-destructive' };
    }
    if (minutesUntil <= 15) {
      return { status: 'soon', label: 'Em breve', color: 'text-warning' };
    }
    if (isToday(date)) {
      return { status: 'today', label: 'Hoje', color: 'text-primary' };
    }
    if (isTomorrow(date)) {
      return { status: 'tomorrow', label: 'Amanhã', color: 'text-muted-foreground' };
    }
    return { status: 'future', label: 'Agendado', color: 'text-muted-foreground' };
  };

  const pendingCallbacks = callbacks.filter(c => c.status === 'pending');
  const overdueCallbacks = pendingCallbacks.filter(c => isPast(new Date(c.scheduled_at)));
  const upcomingCallbacks = pendingCallbacks.filter(c => !isPast(new Date(c.scheduled_at)));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Callbacks Agendados
            {overdueCallbacks.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {overdueCallbacks.length} atrasados
              </Badge>
            )}
          </CardTitle>
          <ScheduleCallbackDialog />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="pending" className="text-xs">
              Pendentes ({pendingCallbacks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Concluídos
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">
              Cancelados
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              Todos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-3">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : callbacks.length === 0 ? (
                <EmptyState 
                  iconType="calendar"
                  title="Nenhum callback encontrado"
                  description="Agende um novo callback usando o botão acima para começar."
                  size="sm"
                  variant="minimal"
                />
              ) : (
                <div className="space-y-3">
                  {callbacks.map((callback) => (
                    <CallbackCard
                      key={callback.id}
                      callback={callback}
                      onCall={handleCall}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                      onDelete={handleDelete}
                      getPriorityColor={getPriorityColor}
                      getPriorityLabel={getPriorityLabel}
                      getTimeStatus={getTimeStatus}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface CallbackCardProps {
  callback: ScheduledCallback;
  onCall: (callback: ScheduledCallback) => void;
  onComplete: (callback: ScheduledCallback) => void;
  onCancel: (callback: ScheduledCallback) => void;
  onDelete: (callback: ScheduledCallback) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityLabel: (priority: string) => string;
  getTimeStatus: (scheduledAt: string) => { status: string; label: string; color: string };
}

function CallbackCard({
  callback,
  onCall,
  onComplete,
  onCancel,
  onDelete,
  getPriorityColor,
  getPriorityLabel,
  getTimeStatus
}: CallbackCardProps) {
  const timeStatus = getTimeStatus(callback.scheduled_at);
  const isOverdue = timeStatus.status === 'overdue';
  const isSoon = timeStatus.status === 'soon';

  return (
    <TooltipProvider>
      <div 
        className={`rounded-lg border p-3 transition-all hover:shadow-md ${
          isOverdue ? 'border-destructive/50 bg-destructive/5' : 
          isSoon ? 'border-warning/50 bg-warning/5' : ''
        } ${callback.status !== 'pending' ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{callback.caller_name}</span>
              <Badge className={`text-xs ${getPriorityColor(callback.priority)}`}>
                {getPriorityLabel(callback.priority)}
              </Badge>
              {callback.status !== 'pending' && (
                <Badge variant="outline" className="text-xs">
                  {callback.status === 'completed' ? 'Concluído' : 'Cancelado'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span className="font-mono">{callback.caller_phone}</span>
            </div>

            {callback.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {callback.notes}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className={`flex items-center gap-1 ${timeStatus.color}`}>
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                {isSoon && <Bell className="h-3 w-3 animate-pulse" />}
                <Calendar className="h-3 w-3" />
                {safeFormatDatePtBR(callback.scheduled_at, "dd/MM 'às' HH:mm")}
              </span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(callback.scheduled_at), { 
                  locale: ptBR, 
                  addSuffix: true 
                })}
              </span>
              {callback.assigned_agent && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  {callback.assigned_agent}
                </span>
              )}
            </div>
          </div>

          {callback.status === 'pending' && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                    onClick={() => onCall(callback)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ligar agora</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onComplete(callback)} className="gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Marcar como Concluído
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCancel(callback)} className="gap-2">
                    <X className="h-4 w-4 text-warning" />
                    Cancelar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(callback)} 
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
