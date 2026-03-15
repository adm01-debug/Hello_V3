import { 
  LayoutDashboard, 
  Phone, 
  Users, 
  Clock, 
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
  PhoneOutgoing,
  MessageCircle,
  Siren,
  ListChecks,
  ScrollText,
  Eye,
  FileBarChart,
  UserCog,
  ChevronDown,
  GitBranch,
  Voicemail,
  Video,
  Monitor as MonitorIcon,
  Printer,
  ArrowLeftRight,
  PhoneCall,
  Tag,
  QrCode,
  FolderSync,
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
import { useAuthContext } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Executivo', url: '/executive', icon: Gauge },
  { title: 'Métricas Fila', url: '/queue-dashboard', icon: Activity },
  { title: 'Chamadas', url: '/calls', icon: Phone },
  { title: 'Discador', url: '/dialer', icon: PhoneOutgoing },
  { title: 'Contatos', url: '/contacts', icon: Users },
  { title: 'Insights', url: '/contacts/insights', icon: Brain },
  { title: 'Histórico', url: '/history', icon: Clock },
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
  { title: 'Transcrições', url: '/call-history', icon: FileText },
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
];

const settingsNavItems = [
  { title: 'Compliance', url: '/compliance', icon: ListChecks },
  { title: 'Alertas de Hold', url: '/hold-settings', icon: Timer },
  { title: 'Alertas de Fila', url: '/queue-metrics-settings', icon: Activity },
  { title: 'Logs de Auditoria', url: '/audit-logs', icon: Eye },
  { title: 'Monitoramento', url: '/security-monitoring', icon: Monitor },
  { title: 'Relatório Segurança', url: '/security-report', icon: FileBarChart },
  { title: 'Roles & Permissões', url: '/roles', icon: UserCog },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

interface NavGroupProps {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
  defaultOpen?: boolean;
}

function NavGroup({ label, items, collapsed, defaultOpen = false }: NavGroupProps) {
  const location = useLocation();
  const hasActive = items.some(item => location.pathname === item.url);
  const [open, setOpen] = useState(defaultOpen || hasActive);

  if (collapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1">
            {items.map((item) => (
              <NavItem key={item.url} item={item} collapsed={collapsed} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">
          {label}
          <ChevronDown className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 mt-1">
              {items.map((item) => (
                <NavItem key={item.url} item={item} collapsed={collapsed} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function NavItem({ item, collapsed }: { item: { title: string; url: string; icon: React.ElementType }; collapsed: boolean }) {
  const location = useLocation();
  const Icon = item.icon;
  const active = location.pathname === item.url;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            active && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="font-medium">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile } = useAuthContext();

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

      <SidebarContent className="px-3 py-4 scrollbar-thin">
        <NavGroup label="Principal" items={mainNavItems} collapsed={collapsed} defaultOpen />
        <NavGroup label="Ferramentas" items={toolsNavItems} collapsed={collapsed} />
        <NavGroup label="Segurança" items={securityNavItems} collapsed={collapsed} />
        <NavGroup label="Sistema" items={settingsNavItems} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
              {profile?.full_name
                ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : profile?.email?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-background bg-success" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {profile?.full_name || profile?.email || 'Usuário'}
              </span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{profile?.role || 'agent'}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
