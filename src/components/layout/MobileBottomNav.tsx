import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Phone, Users, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Chamadas', url: '/calls', icon: Phone },
  { title: 'Contatos', url: '/contacts', icon: Users },
  { title: 'Histórico', url: '/history', icon: Clock },
  { title: 'Config', url: '/settings', icon: Settings },
];

export const MobileBottomNav = memo(function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 z-50 flex md:hidden items-center justify-around rounded-3xl border border-white/[0.08] glass-dark px-2 py-1 shadow-2xl"
      aria-label="Navegação principal mobile"
      role="navigation"
    >
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.url;
        return (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors relative',
              active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <span
                className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                aria-hidden="true"
              />
            )}
            <Icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]')} />
            <span>{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
});
