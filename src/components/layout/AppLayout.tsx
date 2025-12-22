import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ActiveCallBar } from '@/components/calls/ActiveCallBar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AlertsDropdown } from '@/components/alerts/AlertsDropdown';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2" />
              
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar contatos, chamadas..." 
                  className="w-80 pl-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AlertsDropdown />
            </div>
          </header>

          {/* Active Call Bar */}
          <ActiveCallBar />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
