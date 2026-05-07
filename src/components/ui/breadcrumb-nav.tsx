import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'dashboard': 'Dashboard',
  'calls': 'Chamadas',
  'call-history': 'Histórico de Chamadas',
  'call-analytics': 'Análise de Chamadas',
  'recordings': 'Gravações',
  'callbacks': 'Callbacks',
  'contacts': 'Contatos',
  'contact-insights': 'Insights de Contatos',
  'dialer': 'Discador',
  'agents': 'Agentes',
  'agent-ranking': 'Ranking de Agentes',
  'coaching': 'Coaching',
  'supervisor': 'Supervisor',
  'executive': 'Dashboard Executivo',
  'queue-metrics': 'Métricas de Fila',
  'settings': 'Configurações',
  'alerts': 'Alertas',
  'hold-alerts': 'Alertas de Espera',
  'hold-metrics': 'Métricas de Espera',
  'queue-metrics-alerts': 'Alertas de Fila',
  'security': 'Segurança',
  'security-monitoring': 'Monitoramento',
  'security-report': 'Relatório de Segurança',
  'ip-whitelist': 'Lista de IPs',
  'blocked-access-logs': 'Acessos Bloqueados',
  'geo-blocking': 'Bloqueio Geográfico',
  'session-management': 'Gestão de Sessões',
  'passkeys': 'Passkeys',
  'two-factor-auth': 'Autenticação 2FA',
  'audit-logs': 'Logs de Auditoria',
  'roles': 'Papéis',
  'permissions': 'Permissões',
  'compliance': 'Compliance',
  'ai-assistant': 'Assistente IA',
  'voice': 'Comandos de Voz',
  'reports': 'Relatórios',
  'rate-limit-dashboard': 'Rate Limit',
};

export function BreadcrumbNav({ 
  items, 
  className,
  showHome = true 
}: BreadcrumbNavProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    return pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      return {
        label,
        href: index < pathSegments.length - 1 ? href : undefined, // Last item has no link
      };
    });
  })();

  // Don't show breadcrumb on home page
  if (location.pathname === '/' && breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav 
      aria-label="Navegação estrutural"
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {showHome && (
          <>
            <li>
              <Link 
                to="/"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Ir para página inicial"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only md:not-sr-only">Início</span>
              </Link>
            </li>
            {breadcrumbs.length > 0 && (
              <li className="text-muted-foreground" aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </li>
            )}
          </>
        )}
        
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span 
                className="flex items-center gap-1.5 font-medium text-foreground"
                aria-current="page"
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Compact version for mobile
export function BreadcrumbCompact({ className }: { className?: string }) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 0) return null;
  
  const currentSegment = pathSegments[pathSegments.length - 1];
  const parentHref = pathSegments.length > 1 
    ? '/' + pathSegments.slice(0, -1).join('/')
    : '/';
  
  const currentLabel = routeLabels[currentSegment] || 
    currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1).replace(/-/g, ' ');

  return (
    <nav 
      aria-label="Navegação estrutural"
      className={cn("flex items-center text-sm", className)}
    >
      <Link
        to={parentHref}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        <span className="sr-only">Voltar</span>
      </Link>
      <span className="ml-2 font-medium truncate max-w-[200px]">
        {currentLabel}
      </span>
    </nav>
  );
}
