import { Inbox, MessageCircle, Mail, MessageSquare, Phone, Smartphone, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversations } from '@/hooks/useConversations';
import { useSlaCompliance } from '@/hooks/useSLA';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const channelMeta = [
  { key: 'voice', label: 'Voz', icon: Phone, color: 'text-primary' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-success' },
  { key: 'email', label: 'E-mail', icon: Mail, color: 'text-accent' },
  { key: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-warning' },
  { key: 'sms', label: 'SMS', icon: Smartphone, color: 'text-secondary-foreground' },
] as const;

export function OmnichannelCard() {
  const { data: conversations = [], isLoading } = useConversations({});
  const { data: compliance } = useSlaCompliance();

  if (isLoading) {
    return (
      <Card className="p-5 bg-card/50 backdrop-blur border-primary/20">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const open = conversations.filter((c) => c.status === 'open' || c.status === 'pending');
  const breaches = open.filter((c) => c.sla_breached).length;

  const byChannel = channelMeta.map((m) => ({
    ...m,
    count: open.filter((c) => c.channel === m.key).length,
  }));

  return (
    <Link to="/inbox" className="block group">
      <Card className="p-5 bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Omnichannel</h3>
          </div>
          {breaches > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {breaches} SLA
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <div className="text-2xl font-bold">{open.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Abertas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success">{compliance?.compliancePct ?? 100}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SLA 7d</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-destructive">{breaches}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Violações</div>
          </div>
        </div>

        <div className="space-y-1.5">
          {byChannel.map(({ key, label, icon: Icon, color, count }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-3.5 w-3.5', color)} />
                <span className="text-xs">{label}</span>
              </div>
              <span className="text-xs font-mono font-medium">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}
