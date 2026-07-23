import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archive, CheckCircle2, Trash2 } from 'lucide-react';

import { ptBR } from 'date-fns/locale';
import {
  categoryIcons,
  categoryLabels,
  fallbackIcon,
  severityColors,
  type NotificationRow,
} from './constants';

import { safeFormatDistanceToNow } from "@/lib/safe-date";
interface Props {
  notifications: NotificationRow[];
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const severityLabel = (severity: string) =>
  severity === 'critical'
    ? 'Crítico'
    : severity === 'warning'
      ? 'Aviso'
      : severity === 'error'
        ? 'Erro'
        : 'Info';

export function NotificationList({
  notifications,
  isLoading,
  onMarkRead,
  onArchive,
  onDelete,
}: Props) {
  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  }
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma notificação encontrada
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = categoryIcons[n.category] ?? fallbackIcon;
          return (
            <Card
              key={n.id}
              className={`transition-all ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      !n.is_read ? 'bg-primary/15' : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        !n.is_read ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-medium text-sm ${
                          !n.is_read ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {n.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${severityColors[n.severity] || ''}`}
                      >
                        {severityLabel(n.severity)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {categoryLabels[n.category] || n.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {safeFormatDistanceToNow(n.created_at, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMarkRead(n.id)}
                        title="Marcar como lida"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!n.is_archived && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onArchive(n.id)}
                        title="Arquivar"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDelete(n.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
