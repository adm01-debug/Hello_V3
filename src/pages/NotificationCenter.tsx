import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Bell, BellRing, CheckCircle2, Trash2, Archive, Mail, Volume2, VolumeX,
  Clock, Shield, Phone, Bot, Trophy, Settings2, Search, Filter, MailOpen
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '@/hooks/usePageTitle';

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  severity: string;
  is_read: boolean;
  is_archived: boolean;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, unknown> | null;
  source_type: string | null;
  source_id: string | null;
  expires_at: string | null;
  read_at: string | null;
  created_at: string;
};

const categoryIcons: Record<string, React.ElementType> = {
  system: Settings2,
  call: Phone,
  security: Shield,
  coaching: Bot,
  gamification: Trophy,
};

const categoryLabels: Record<string, string> = {
  system: 'Sistema',
  call: 'Chamadas',
  security: 'Segurança',
  coaching: 'Coaching',
  gamification: 'Gamificação',
};

const severityColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-warning/20 text-warning',
  info: 'bg-primary/15 text-primary',
  success: 'bg-emerald-500/15 text-emerald-600',
};

export default function NotificationCenter() {
  usePageTitle('Notificações');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tab, setTab] = useState('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-center', tab],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (tab === 'unread') query = query.eq('is_read', false);
      if (tab === 'archived') query = query.eq('is_archived', true);
      else query = query.eq('is_archived', false);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as NotificationRow[];
    },
    enabled: !!user,
  });

  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-center'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      toast.success('Todas marcadas como lidas');
    },
  });

  const archiveNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-center'] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      toast.success('Notificação removida');
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (prefs: Record<string, unknown>) => {
      if (!user) return;
      const { error } = await supabase.from('notification_preferences').upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferências atualizadas');
    },
  });

  const filtered = notifications.filter(n => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Central de Notificações</h1>
            <p className="text-muted-foreground">Gerencie todas suas notificações e preferências</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
            <MailOpen className="h-4 w-4 mr-2" />
            Marcar todas como lidas ({unreadCount})
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Bell className="h-4 w-4" />
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <BellRing className="h-4 w-4" />
              Não lidas
              {unreadCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="h-4 w-4" />
              Arquivadas
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Preferências
            </TabsTrigger>
          </TabsList>

          {tab !== 'preferences' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 w-48" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="all" className="mt-4">
          <NotificationList notifications={filtered} isLoading={isLoading} onMarkRead={id => markAsRead.mutate(id)} onArchive={id => archiveNotification.mutate(id)} onDelete={id => deleteNotification.mutate(id)} />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationList notifications={filtered} isLoading={isLoading} onMarkRead={id => markAsRead.mutate(id)} onArchive={id => archiveNotification.mutate(id)} onDelete={id => deleteNotification.mutate(id)} />
        </TabsContent>
        <TabsContent value="archived" className="mt-4">
          <NotificationList notifications={filtered} isLoading={isLoading} onMarkRead={id => markAsRead.mutate(id)} onArchive={id => archiveNotification.mutate(id)} onDelete={id => deleteNotification.mutate(id)} />
        </TabsContent>
        <TabsContent value="preferences" className="mt-4">
          <PreferencesPanel preferences={preferences} onUpdate={prefs => updatePreferences.mutate(prefs)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationList({ notifications, isLoading, onMarkRead, onArchive, onDelete }: {
  notifications: NotificationRow[];
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (notifications.length === 0) return <div className="text-center py-12 text-muted-foreground">Nenhuma notificação encontrada</div>;

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-2">
        {notifications.map(n => {
          const Icon = categoryIcons[n.category] || Bell;
          return (
            <Card key={n.id} className={`transition-all ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${!n.is_read ? 'bg-primary/15' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${!n.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                      <Badge variant="secondary" className={`text-[10px] ${severityColors[n.severity] || ''}`}>
                        {n.severity === 'critical' ? 'Crítico' : n.severity === 'warning' ? 'Aviso' : n.severity === 'error' ? 'Erro' : 'Info'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[n.category] || n.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMarkRead(n.id)} title="Marcar como lida">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!n.is_archived && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onArchive(n.id)} title="Arquivar">
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(n.id)} title="Excluir">
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

function PreferencesPanel({ preferences, onUpdate }: {
  preferences: Record<string, unknown> | null;
  onUpdate: (prefs: Record<string, unknown>) => void;
}) {
  const emailEnabled = (preferences?.email_enabled as boolean) ?? true;
  const pushEnabled = (preferences?.push_enabled as boolean) ?? true;
  const soundEnabled = (preferences?.sound_enabled as boolean) ?? true;
  const digestEnabled = (preferences?.digest_enabled as boolean) ?? false;
  const digestFrequency = (preferences?.digest_frequency as string) ?? 'daily';
  const quietHoursEnabled = (preferences?.quiet_hours_enabled as boolean) ?? false;
  const quietHoursStart = (preferences?.quiet_hours_start as string) ?? '22:00';
  const quietHoursEnd = (preferences?.quiet_hours_end as string) ?? '08:00';
  const categories = (preferences?.categories as Record<string, boolean>) ?? {
    system: true, call: true, security: true, coaching: true, gamification: true };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Canais de Entrega</CardTitle>
          <CardDescription>Escolha como receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> E-mail</Label>
            <Switch checked={emailEnabled} onCheckedChange={v => onUpdate({ email_enabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Bell className="h-4 w-4" /> Push (Navegador)</Label>
            <Switch checked={pushEnabled} onCheckedChange={v => onUpdate({ push_enabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Som</Label>
            <Switch checked={soundEnabled} onCheckedChange={v => onUpdate({ sound_enabled: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Horário Silencioso</CardTitle>
          <CardDescription>Desative notificações em determinados horários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar horário silencioso</Label>
            <Switch checked={quietHoursEnabled} onCheckedChange={v => onUpdate({ quiet_hours_enabled: v })} />
          </div>
          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Início</Label>
                <Input type="time" value={quietHoursStart} onChange={e => onUpdate({ quiet_hours_start: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fim</Label>
                <Input type="time" value={quietHoursEnd} onChange={e => onUpdate({ quiet_hours_end: e.target.value })} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Resumo por E-mail</CardTitle>
          <CardDescription>Receba um digest periódico por e-mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar digest</Label>
            <Switch checked={digestEnabled} onCheckedChange={v => onUpdate({ digest_enabled: v })} />
          </div>
          {digestEnabled && (
            <div className="space-y-1">
              <Label className="text-xs">Frequência</Label>
              <Select value={digestFrequency} onValueChange={v => onUpdate({ digest_frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" /> Categorias</CardTitle>
          <CardDescription>Selecione quais categorias deseja receber</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const CatIcon = categoryIcons[key] || Bell;
            return (
              <div key={key} className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><CatIcon className="h-4 w-4" /> {label}</Label>
                <Switch checked={categories[key] !== false} onCheckedChange={v => onUpdate({ categories: { ...categories, [key]: v } })} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
