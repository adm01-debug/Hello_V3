import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX, Home } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Unauthorized() {
  usePageTitle('Não Autorizado');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Acesso Negado</h1>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar esta página. 
            Entre em contato com um administrador se acredita que isso é um erro.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  );
}
