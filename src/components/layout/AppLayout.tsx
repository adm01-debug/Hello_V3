import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ActiveCallBar } from '@/components/calls/ActiveCallBar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AlertsDropdown } from '@/components/alerts/AlertsDropdown';
import { ContactAlertsDropdown } from '@/components/contacts/ContactAlertsDropdown';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { BreadcrumbCompact } from '@/components/ui/breadcrumb-nav';
import { SkipLink } from '@/components/ui/keyboard-navigation';
import { ThemeToggle } from './ThemeToggle';
import { BackButton } from '@/components/navigation/BackButton';
import { PageTransition } from '@/components/navigation/PageTransition';
import { NavigationProgress } from '@/components/navigation/NavigationProgress';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      {/* Navigation progress bar */}
      <NavigationProgress />
      
      {/* Skip Link for A11Y */}
      <SkipLink href="#main-content" />
      
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col">
          {/* Header — glass morphism */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/30 px-4 md:px-6 glass">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-primary transition-colors" />
              
              {/* Back button */}
              <BackButton />
              
              {/* Breadcrumb compact on mobile */}
              <div className="block lg:hidden">
                <BreadcrumbCompact />
              </div>
              
              {/* Breadcrumb full on desktop */}
              <div className="hidden lg:block">
                <BreadcrumbNav />
              </div>
              
              {/* Search — neon focus */}
              <div className="relative hidden md:block lg:ml-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar contatos, chamadas..." 
                  className="w-64 lg:w-80 pl-9 bg-muted/50 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-shadow"
                  aria-label="Buscar no sistema"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <NotificationBell />
              <ContactAlertsDropdown />
              <AlertsDropdown />
            </div>
          </header>

          {/* Active Call Bar */}
          <ActiveCallBar />

          {/* Main Content with page transition */}
          <main id="main-content" className="flex-1 overflow-auto scrollbar-thin" tabIndex={-1}>
            <PageTransition>
              <div className="container max-w-7xl py-6">
                {children}
              </div>
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
