import { 
  CircleParking,
  LayoutDashboard, Phone, Users, Clock, Settings, Headphones, BarChart3, Bot, FileText, PieChart, Bell, Trophy, Gauge, Brain, Disc, Timer, AlertTriangle, Calendar, Activity, History, Shield, ShieldCheck, Key, Monitor, Lock, Fingerprint, Globe, PhoneOutgoing, MessageCircle, Siren, ListChecks, ScrollText, Eye, FileBarChart, UserCog, ChevronDown, GitBranch, Voicemail, Video, Monitor as MonitorIcon, Printer, ArrowLeftRight, PhoneCall, Tag, QrCode, FolderSync, Star, StarOff, BellRing, Library, Swords, Cloud, CalendarDays, Award, GraduationCap, Sparkles, Languages, Inbox as InboxIcon, BookOpen, Clock as ClockIcon, Wifi,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useCallback, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useUnreadConflicts } from '@/hooks/useUnreadConflicts';
import { prefetchHandlers } from '@/lib/route-prefetch';

const mainNavItems = [
  { title: 'Discador', url: '/', icon: PhoneOutgoing },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Executivo', url: '/executive', icon: Gauge },
  { title: 'Impacto Financeiro', url: '/financial-impact', icon: PieChart },
  { title: 'Métricas Fila', url: '/queue-dashboard', icon: Activity },
  { title: 'Chamadas', url: '/calls', icon: Phone },
  { title: 'Estacionamento', url: '/call-park', icon: CircleParking },
  { title: 'Discador Preditivo', url: '/dialer', icon: PhoneOutgoing },
  { title: 'Contatos', url: '/contacts', icon: Users },
  { title: 'Insights', url: '/contacts/insights', icon: Brain },
   { title: 'Histórico Completo', url: '/history', icon: Clock },
];

const toolsNavItems = [
  { title: 'Assistente IA', url: '/ai', icon: Bot },
  { title: 'Coaching IA', url: '/coaching', icon: MessageCircle },
  { title: 'Call Flow Designer', url: '/call-flow-designer', icon: GitBranch },
  { title: 'Correio de Voz', url: '/voicemail', icon: Voicemail },
  { title: 'Detecção de Temas', url: '/topic-detection', icon: Tag },
  { title: 'Videoconferência', url: '/video-conference', icon: Video },
  { title: 'Multi-device Ring', url: '/multi-device-ring', icon: PhoneCall },
  { title: 'Hot Desking', url: '/hot-desking', icon: MonitorIcon },
   { title: 'Callbacks', url: '/callbacks', icon: Calendar },
   { title: 'Gravações', url: '/recordings', icon: Disc },
  { title: 'Métricas de Espera', url: '/hold-metrics', icon: Timer },
  { title: 'Alertas de Espera', url: '/hold-alerts', icon: Siren },
  { title: 'Analytics', url: '/analytics', icon: PieChart },
  { title: 'Alertas', url: '/alerts', icon: Bell },
  { title: 'Histórico Alertas', url: '/alert-history', icon: History },
  { title: 'Gamificação', url: '/ranking', icon: Trophy },
  { title: 'Relatórios', url: '/reports', icon: BarChart3 },
  { title: 'Fax Virtual', url: '/virtual-fax', icon: Printer },
  { title: 'Portabilidade', url: '/number-porting', icon: ArrowLeftRight },
  { title: 'Números 0800', url: '/toll-free-numbers', icon: PhoneCall },
  { title: 'QR Provisioning', url: '/qr-provisioning', icon: QrCode },
  { title: 'LDAP Sync', url: '/ldap-sync', icon: FolderSync },
  { title: 'Biblioteca de Calls', url: '/call-library', icon: Library },
  { title: 'Battle Cards', url: '/battle-cards', icon: Swords },
  { title: 'Importar Gravações', url: '/external-recordings-import', icon: Cloud },
  { title: 'Escala & Turnos', url: '/scheduling', icon: CalendarDays },
  { title: 'Habilidades', url: '/skills', icon: Award },
  { title: 'Aprendizagem', url: '/learning', icon: GraduationCap },
  { title: 'Resumos IA', url: '/meeting-summaries', icon: Sparkles },
  { title: 'Agent Assist', url: '/agent-assist', icon: Brain },
  { title: 'Voice Security', url: '/voice-security', icon: Fingerprint },
  { title: 'Tradução Multilíngue', url: '/translation-center', icon: Languages },
];

const omnichannelNavItems = [
  { title: 'Caixa de Entrada', url: '/inbox', icon: InboxIcon },
  { title: 'Base de Conhecimento', url: '/knowledge', icon: BookOpen },
  { title: 'Regras de Roteamento', url: '/routing-rules', icon: GitBranch },
  { title: 'Políticas SLA', url: '/sla-policies', icon: ClockIcon },
];

const securityNavItems = [
  { title: 'Central de Segurança', url: '/security', icon: ShieldCheck },
  { title: 'Sessões Ativas', url: '/sessions', icon: Monitor },
  { title: 'Autenticação 2FA', url: '/two-factor-auth', icon: Key },
  { title: 'Passkeys', url: '/passkeys', icon: Fingerprint },
  { title: 'Whitelist IPs', url: '/ip-whitelist', icon: Lock },
  { title: 'Bloqueio Geográfico', url: '/geo-blocking', icon: Globe },
  { title: 'Reset de Senha', url: '/password-reset-approval', icon: ScrollText },
  { title: 'Acessos Bloqueados', url: '/blocked-access-logs', icon: Shield },
  { title: 'Rate Limit', url: '/rate-limit', icon: AlertTriangle },
  { title: 'Observabilidade', url: '/observability', icon: Activity },
  { title: 'Diagnóstico de Rede', url: '/network-diagnostics', icon: Wifi },
  { title: 'Conflitos de Concorrência', url: '/concurrency-conflicts', icon: AlertTriangle },
];

const settingsNavItems = [
  { title: 'Notificações', url: '/notifications', icon: BellRing },
  { title: 'Compliance', url: '/compliance', icon: ListChecks },
  { title: 'Outbound Compliance', url: '/outbound-compliance', icon: ShieldCheck },
  { title: 'Alertas de Hold', url: '/hold-settings', icon: Timer },
  { title: 'Alertas de Fila', url: '/queue-metrics-settings', icon: Activity },
  { title: 'Logs de Auditoria', url: '/audit-logs', icon: Eye },
  { title: 'Monitoramento', url: '/security-monitoring', icon: Monitor },
  { title: 'Relatório Segurança', url: '/security-report', icon: FileBarChart },
  { title: 'Roles & Permissões', url: '/roles', icon: UserCog },
  { title: 'Linhas VoIP', url: '/admin/voip-trunks', icon: Phone },
  { title: 'Ramais', url: '/admin/extensions', icon: Headphones },
  { title: 'Filas de Atendimento', url: '/call-queues', icon: ListChecks },
  { title: 'Grupos de Toque', url: '/ring-groups', icon: BellRing },
  { title: 'Sugestões de Escala IA', url: '/shift-swap-suggestions', icon: CalendarDays },
  { title: 'Exportação Data Lake', url: '/admin/data-export', icon: Cloud },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

type NavItemType = { title: string; url: string; icon: React.ElementType };

interface NavGroupProps {
  label: string;
  items: NavItemType[];
  collapsed: boolean;
  defaultOpen?: boolean;
  favorites: string[];
  onToggleFavorite: (url: string) => void;
}

function NavGroup({ label, items, collapsed, defaultOpen = false, favorites, onToggleFavorite }: NavGroupProps) {
  const location = useLocation();
  const hasActive = items.some(item => location.pathname === item.url);
  const [open, setOpen] = useState(defaultOpen || hasActive);

  if (collapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            {items.map((item) => (
              <NavItem key={item.url} item={item} collapsed={collapsed} isFavorite={favorites.includes(item.url)} onToggleFavorite={onToggleFavorite} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40 hover:text-sidebar-primary transition-colors">
          {label}
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-300",
            open && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 mt-1">
              {items.map((item) => (
                <NavItem key={item.url} item={item} collapsed={collapsed} isFavorite={favorites.includes(item.url)} onToggleFavorite={onToggleFavorite} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function NavItem({ item, collapsed, isFavorite, onToggleFavorite }: { item: NavItemType; collapsed: boolean; isFavorite: boolean; onToggleFavorite: (url: string) => void }) {
  const location = useLocation();
  const Icon = item.icon;
  const active = location.pathname === item.url;
  const { data: conflictCount } = useUnreadConflicts();
  const showConflictBadge = item.url === '/concurrency-conflicts' && (conflictCount ?? 0) > 0;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          {...prefetchHandlers(item.url)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-all duration-200 group/nav',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            active && [
              'bg-sidebar-primary/15 text-sidebar-primary',
              'shadow-[inset_0_0_20px_hsl(var(--sidebar-primary)/0.08),0_0_15px_hsl(var(--sidebar-primary)/0.1)]',
              'border border-sidebar-primary/20',
              'hover:bg-sidebar-primary/20 hover:text-sidebar-primary',
            ]
          )}
        >
          <Icon className={cn(
            "h-4 w-4 shrink-0 transition-all duration-200",
            active && "drop-shadow-[0_0_6px_hsl(var(--sidebar-primary)/0.6)]"
          )} />
          {!collapsed && (
            <>
              <span className={cn("font-medium flex-1", active && "font-semibold")}>
                {item.title}
              </span>
              {showConflictBadge && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                  {conflictCount! > 99 ? '99+' : conflictCount}
                </Badge>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(item.url);
                }}
                className={cn(
                  "h-4 w-4 shrink-0 transition-opacity",
                  isFavorite ? "opacity-100 text-warning" : "opacity-0 group-hover/nav:opacity-50 hover:!opacity-100 text-muted-foreground"
                )}
                aria-label={isFavorite ? `Remover ${item.title} dos favoritos` : `Adicionar ${item.title} aos favoritos`}
              >
                {isFavorite ? <Star className="h-3.5 w-3.5 fill-current" /> : <Star className="h-3.5 w-3.5" />}
              </button>
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

const FAVORITES_KEY = 'voip-sidebar-favorites';

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch { return []; }
  });

  const toggle = useCallback((url: string) => {
    setFavorites(prev => {
      const next = prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, toggle };
}

const allItems = [...mainNavItems, ...omnichannelNavItems, ...toolsNavItems, ...securityNavItems, ...settingsNavItems];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
   const { profile } = useAuthContext();
  const { favorites, toggle } = useFavorites();

  const favoriteItems = useMemo(
    () => allItems.filter(item => favorites.includes(item.url)),
    [favorites]
  );

  return (
     <Sidebar collapsible="icon" className="border-r border-sidebar-border/50" aria-label="Navegação Principal">
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary shadow-[0_0_20px_hsl(var(--sidebar-primary)/0.4)]">
            <Headphones className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
               <span className="text-base font-bold text-sidebar-foreground text-display tracking-wider" aria-hidden="true">
                VoIP Panel
              </span>
               <span className="text-[10px] uppercase tracking-widest text-sidebar-primary/60" aria-hidden="true">
                Central de Atendimento
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 scrollbar-thin">
        {/* Favorites section */}
        {favoriteItems.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-warning/70 flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-current" />
                Favoritos
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {favoriteItems.map((item) => (
                  <NavItem key={`fav-${item.url}`} item={item} collapsed={collapsed} isFavorite onToggleFavorite={toggle} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <NavGroup label="Principal" items={mainNavItems} collapsed={collapsed} defaultOpen favorites={favorites} onToggleFavorite={toggle} />
        <NavGroup label="Atendimento" items={omnichannelNavItems} collapsed={collapsed} defaultOpen favorites={favorites} onToggleFavorite={toggle} />
        <NavGroup label="Ferramentas" items={toolsNavItems} collapsed={collapsed} favorites={favorites} onToggleFavorite={toggle} />
        <NavGroup label="Segurança" items={securityNavItems} collapsed={collapsed} favorites={favorites} onToggleFavorite={toggle} />
        <NavGroup label="Sistema" items={settingsNavItems} collapsed={collapsed} favorites={favorites} onToggleFavorite={toggle} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/15 text-sm font-bold text-sidebar-primary border border-sidebar-primary/25 shadow-[0_0_12px_hsl(var(--sidebar-primary)/0.2)]">
              {profile?.full_name
                ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : profile?.email?.slice(0, 2).toUpperCase() || '??'}
            </div>
             <div className={cn(
               "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-background",
               profile?.role === 'admin' ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" : "status-dot-online"
             )} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {profile?.full_name || profile?.email || 'Usuário'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-primary/60">
                {profile?.role || 'agent'}
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
