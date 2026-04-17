import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Phone, Users, Clock, Settings, Bot, FileText, PieChart, Bell, Trophy, Gauge, Brain, Disc, Timer, Calendar, Activity, History, Shield, ShieldCheck, Key, Monitor, Lock, Fingerprint, Globe, PhoneOutgoing, MessageCircle, Siren, ListChecks, ScrollText, Eye, FileBarChart, UserCog, GitBranch, Voicemail, Video, Printer, ArrowLeftRight, PhoneCall, Tag, QrCode, FolderSync, BarChart3, AlertTriangle, Headphones, Library, Swords, DownloadCloud, Sparkles,
} from 'lucide-react';

const allRoutes = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, group: 'Principal' },
  { title: 'Dashboard Executivo', url: '/executive', icon: Gauge, group: 'Principal' },
  { title: 'Métricas de Fila', url: '/queue-dashboard', icon: Activity, group: 'Principal' },
  { title: 'Chamadas', url: '/calls', icon: Phone, group: 'Principal' },
  { title: 'Discador Preditivo', url: '/dialer', icon: PhoneOutgoing, group: 'Principal' },
  { title: 'Contatos', url: '/contacts', icon: Users, group: 'Principal' },
  { title: 'Insights de Contatos', url: '/contacts/insights', icon: Brain, group: 'Principal' },
  { title: 'Histórico', url: '/history', icon: Clock, group: 'Principal' },
  { title: 'Assistente IA', url: '/ai', icon: Bot, group: 'Ferramentas' },
  { title: 'Coaching IA', url: '/coaching', icon: MessageCircle, group: 'Ferramentas' },
  { title: 'Call Flow Designer', url: '/call-flow-designer', icon: GitBranch, group: 'Ferramentas' },
  { title: 'Correio de Voz', url: '/voicemail', icon: Voicemail, group: 'Ferramentas' },
  { title: 'Detecção de Temas', url: '/topic-detection', icon: Tag, group: 'Ferramentas' },
  { title: 'Videoconferência', url: '/video-conference', icon: Video, group: 'Ferramentas' },
  { title: 'Multi-device Ring', url: '/multi-device-ring', icon: PhoneCall, group: 'Ferramentas' },
  { title: 'Hot Desking', url: '/hot-desking', icon: Headphones, group: 'Ferramentas' },
  { title: 'Callbacks', url: '/callbacks', icon: Calendar, group: 'Ferramentas' },
  { title: 'Transcrições', url: '/call-history', icon: FileText, group: 'Ferramentas' },
  { title: 'Gravações', url: '/recordings', icon: Disc, group: 'Ferramentas' },
  { title: 'Biblioteca de Calls', url: '/call-library', icon: Library, group: 'Ferramentas' },
  { title: 'Battle Cards', url: '/battle-cards', icon: Swords, group: 'Ferramentas' },
  { title: 'Resumos IA de Reuniões', url: '/meeting-summaries', icon: Sparkles, group: 'Ferramentas' },
  { title: 'Agent Assist (tempo real)', url: '/agent-assist', icon: Brain, group: 'Ferramentas' },
  { title: 'Importar Gravações Teams', url: '/external-recordings-import', icon: DownloadCloud, group: 'Ferramentas' },
  { title: 'Métricas de Espera', url: '/hold-metrics', icon: Timer, group: 'Ferramentas' },
  { title: 'Alertas de Espera', url: '/hold-alerts', icon: Siren, group: 'Ferramentas' },
  { title: 'Analytics', url: '/analytics', icon: PieChart, group: 'Ferramentas' },
  { title: 'Alertas', url: '/alerts', icon: Bell, group: 'Ferramentas' },
  { title: 'Gamificação', url: '/ranking', icon: Trophy, group: 'Ferramentas' },
  { title: 'Relatórios', url: '/reports', icon: BarChart3, group: 'Ferramentas' },
  { title: 'Fax Virtual', url: '/virtual-fax', icon: Printer, group: 'Ferramentas' },
  { title: 'Portabilidade', url: '/number-porting', icon: ArrowLeftRight, group: 'Ferramentas' },
  { title: 'Números 0800', url: '/toll-free-numbers', icon: PhoneCall, group: 'Ferramentas' },
  { title: 'QR Provisioning', url: '/qr-provisioning', icon: QrCode, group: 'Ferramentas' },
  { title: 'LDAP Sync', url: '/ldap-sync', icon: FolderSync, group: 'Ferramentas' },
  { title: 'Central de Segurança', url: '/security', icon: ShieldCheck, group: 'Segurança' },
  { title: 'Sessões Ativas', url: '/sessions', icon: Monitor, group: 'Segurança' },
  { title: 'Autenticação 2FA', url: '/two-factor-auth', icon: Key, group: 'Segurança' },
  { title: 'Passkeys', url: '/passkeys', icon: Fingerprint, group: 'Segurança' },
  { title: 'Whitelist IPs', url: '/ip-whitelist', icon: Lock, group: 'Segurança' },
  { title: 'Bloqueio Geográfico', url: '/geo-blocking', icon: Globe, group: 'Segurança' },
  { title: 'Rate Limit', url: '/rate-limit', icon: AlertTriangle, group: 'Segurança' },
  { title: 'Observabilidade', url: '/observability', icon: Activity, group: 'Segurança' },
  { title: 'Compliance', url: '/compliance', icon: ListChecks, group: 'Sistema' },
  { title: 'Logs de Auditoria', url: '/audit-logs', icon: Eye, group: 'Sistema' },
  { title: 'Monitoramento', url: '/security-monitoring', icon: Monitor, group: 'Sistema' },
  { title: 'Relatório Segurança', url: '/security-report', icon: FileBarChart, group: 'Sistema' },
  { title: 'Roles & Permissões', url: '/roles', icon: UserCog, group: 'Sistema' },
  { title: 'Configurações', url: '/settings', icon: Settings, group: 'Sistema' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, typeof allRoutes>();
    allRoutes.forEach((r) => {
      const list = map.get(r.group) || [];
      list.push(r);
      map.set(r.group, list);
    });
    return map;
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página, ferramenta ou configuração..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {Array.from(groups.entries()).map(([group, items], idx) => (
          <div key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.url}
                    value={item.title}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
