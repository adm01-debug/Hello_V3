 import { useTelemetry } from '@/hooks/telemetry/useTelemetry';
import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ActiveCallBar } from '@/components/calls/ActiveCallBar';
  import { Search } from 'lucide-react';
  import { TooltipProvider } from '@/components/ui/tooltip';
  import { NetworkStatusIndicator } from '@/components/network/NetworkStatusIndicator';
 import { UnifiedNotificationDropdown } from '@/components/notifications/UnifiedNotificationDropdown';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { BreadcrumbCompact } from '@/components/ui/breadcrumb-nav';
import { SkipLink } from '@/components/ui/keyboard-navigation';
import { ThemeToggle } from './ThemeToggle';
import { BackButton } from '@/components/navigation/BackButton';
import { PageTransition } from '@/components/navigation/PageTransition';
import { NavigationProgress } from '@/components/navigation/NavigationProgress';
import { CommandPalette } from './CommandPalette';
 import { MobileBottomNav } from './MobileBottomNav';
 import { OnboardingWizard } from './OnboardingWizard';

interface AppLayoutProps {
  children: ReactNode;
}

 export function AppLayout({ children }: AppLayoutProps) {
   useTelemetry();
  return (
     <SidebarProvider defaultOpen={true}>
       {/* Global Utilities */}
       <CommandPalette />
       <OnboardingWizard />
       
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
              
              {/* Search trigger — opens Command Palette */}
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="hidden md:flex items-center gap-2 lg:ml-4 w-64 lg:w-80 pl-3 pr-3 h-9 rounded-md bg-muted/50 border border-border/50 text-sm text-muted-foreground hover:border-primary/40 hover:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-all cursor-pointer"
                aria-label="Buscar no sistema (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Buscar...</span>
                <kbd className="pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

              <div className="flex items-center gap-2 md:gap-3">
                <TooltipProvider>
                  <NetworkStatusIndicator />
                </TooltipProvider>
                <ThemeToggle />
               <UnifiedNotificationDropdown />
            </div>
          </header>

          {/* Active Call Bar */}
          <ActiveCallBar />

          {/* Main Content with page transition */}
          <main id="main-content" className="flex-1 overflow-auto scrollbar-thin pb-16 md:pb-0" tabIndex={-1}>
            <PageTransition>
              <div className="container max-w-7xl py-6">
                {children}
              </div>
            </PageTransition>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
