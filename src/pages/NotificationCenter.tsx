import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Archive, Bell, BellRing, Filter, MailOpen, Search, Settings2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNotificationCenter } from '@/components/notification-center/useNotificationCenter';
import { NotificationList } from '@/components/notification-center/NotificationList';
import { PreferencesPanel } from '@/components/notification-center/PreferencesPanel';
import { categoryLabels } from '@/components/notification-center/constants';

export default function NotificationCenter() {
  usePageTitle('Notificações');
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tab, setTab] = useState('all');

  const {
    notifications,
    isLoading,
    preferences,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    updatePreferences,
  } = useNotificationCenter(user, tab);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return notifications.filter((n) => {
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
      if (
        term &&
        !n.title.toLowerCase().includes(term) &&
        !n.message.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [notifications, categoryFilter, search]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const listProps = {
    notifications: filtered,
    isLoading,
    onMarkRead: (id: string) => markAsRead.mutate(id),
    onArchive: (id: string) => archiveNotification.mutate(id),
    onDelete: (id: string) => deleteNotification.mutate(id),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Central de Notificações</h1>
            <p className="text-muted-foreground">
              Gerencie todas suas notificações e preferências
            </p>
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
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
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
                <Input
                  placeholder="Buscar..."
                  className="pl-9 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="all" className="mt-4">
          <NotificationList {...listProps} />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationList {...listProps} />
        </TabsContent>
        <TabsContent value="archived" className="mt-4">
          <NotificationList {...listProps} />
        </TabsContent>
        <TabsContent value="preferences" className="mt-4">
          <PreferencesPanel
            preferences={preferences}
            onUpdate={(prefs) => updatePreferences.mutate(prefs)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
