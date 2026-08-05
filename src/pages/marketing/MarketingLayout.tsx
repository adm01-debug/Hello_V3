import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu } from "lucide-react";

interface MarketingLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

/**
 * Layout público para páginas de marketing (landing, pricing, comparativos).
 * Header/footer próprios — não usa AppLayout autenticado.
 */
export function MarketingLayout({ children, title, description }: MarketingLayoutProps) {
  useEffect(() => {
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", description);
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/landing" className="flex items-center gap-2 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg tracking-tight">CallCenter Pro</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/landing#solucoes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Soluções
            </Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </Link>
            <Link to="/vs/3cplus" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comparativo
            </Link>
            <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Integrações
            </Link>
            <Link to="/status" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Status
            </Link>
            <Link to="/landing#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <Link to="/landing#demo">Agendar demo</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-24 border-t border-border/40 bg-muted/20">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold">
              <Phone className="h-5 w-5 text-primary" />
              CallCenter Pro
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Plataforma unificada de VoIP, omnichannel e inteligência de conversa para operações que exigem excelência.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Produto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/landing#solucoes" className="hover:text-foreground">Discador</Link></li>
              <li><Link to="/landing#solucoes" className="hover:text-foreground">Omnichannel</Link></li>
              <li><Link to="/landing#solucoes" className="hover:text-foreground">Receptivo</Link></li>
              <li><Link to="/landing#ia" className="hover:text-foreground">Inteligência de Conversa</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/pricing" className="hover:text-foreground">Planos</Link></li>
              <li><Link to="/vs/3cplus" className="hover:text-foreground">vs. 3C Plus</Link></li>
              <li><Link to="/landing#faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Entrar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>LGPD & Privacidade</li>
              <li>Termos de uso</li>
              <li>Segurança</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CallCenter Pro — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
