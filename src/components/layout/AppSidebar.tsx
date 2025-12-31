import { 
  LayoutDashboard, 
  Phone, 
  Users, 
  Clock, 
  Mic, 
  Settings,
  Headphones,
  BarChart3,
  Bot,
  FileText,
  PieChart,
  Bell,
  Trophy,
  Gauge,
  Brain,
  Disc,
  Timer,
  AlertTriangle,
  Calendar,
  Activity,
  History,
  Shield,
  ShieldCheck,
  Key,
  Monitor,
  Lock,
  Fingerprint,
  Globe,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Executivo', url: '/executive', icon: Gauge },
  { title: 'Métricas Fila', url: '/queue-dashboard', icon: Activity },
  { title: 'Chamadas', url: '/calls', icon: Phone },
  { title: 'Discador', url: '/dialer', icon: Phone },
  { title: 'Contatos', url: '/contacts', icon: Users },
  { title: 'Insights', url: '/contacts/insights', icon: Brain },
  { title: 'Histórico', url: '/history', icon: Clock },
];

const toolsNavItems = [
  { title: 'Assistente IA', url: '/ai', icon: Bot },
  { title: 'Coaching IA', url: '/coaching', icon: Brain },
  { title: 'Comando de Voz', url: '/voice', icon: Mic },
  { title: 'Callbacks', url: '/callbacks', icon: Calendar },
  { title: 'Transcrições', url: '/call-history', icon: FileText },
  { title: 'Gravações', url: '/recordings', icon: Disc },
  { title: 'Métricas de Espera', url: '/hold-metrics', icon: Timer },
  { title: 'Alertas de Espera', url: '/hold-alerts', icon: AlertTriangle },
  { title: 'Analytics', url: '/analytics', icon: PieChart },
  { title: 'Alertas', url: '/alerts', icon: Bell },
  { title: 'Histórico Alertas', url: '/alert-history', icon: History },
  { title: 'Gamificação', url: '/ranking', icon: Trophy },
  { title: 'Relatórios', url: '/reports', icon: BarChart3 },
];

const securityNavItems = [
  { title: 'Central de Segurança', url: '/security', icon: ShieldCheck },
  { title: 'Sessões Ativas', url: '/sessions', icon: Monitor },
  { title: 'Autenticação 2FA', url: '/two-factor-auth', icon: Key },
  { title: 'Passkeys', url: '/passkeys', icon: Fingerprint },
  { title: 'Whitelist IPs', url: '/ip-whitelist', icon: Lock },
  { title: 'Bloqueio Geográfico', url: '/geo-blocking', icon: Globe },
  { title: 'Acessos Bloqueados', url: '/blocked-access-logs', icon: Shield },
  { title: 'Rate Limit', url: '/rate-limit', icon: Activity },
];

const settingsNavItems = [
  { title: 'Alertas de Hold', url: '/hold-settings', icon: AlertTriangle },
  { title: 'Alertas de Fila', url: '/queue-metrics-settings', icon: Activity },
  { title: 'Logs de Auditoria', url: '/audit-logs', icon: Shield },
  { title: 'Monitoramento', url: '/security-monitoring', icon: Activity },
  { title: 'Relatório Segurança', url: '/security-report', icon: Shield },
  { title: 'Roles & Permissões', url: '/roles', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: { title: string; url: string; icon: React.ElementType } }) => {
    const Icon = item.icon;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isActive(item.url) && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="font-medium">{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Headphones className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">VoIP Panel</span>
              <span className="text-xs text-sidebar-foreground/60">Central de Atendimento</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Ferramentas
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {toolsNavItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Segurança
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {securityNavItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Sistema
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsNavItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
              LF
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-background bg-success" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">Lucas Ferreira</span>
              <span className="text-xs text-sidebar-foreground/60">Disponível</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
