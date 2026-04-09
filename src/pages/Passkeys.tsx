import { useAuthContext } from '@/contexts/AuthContext';
import { PasskeyManager } from '@/components/auth/PasskeyManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Passkeys() {
  usePageTitle('Passkeys');

  const { user } = useAuthContext();

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/two-factor-auth">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint className="h-6 w-6 text-primary" />
            Passkeys / Login Biométrico
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure login sem senha usando Face ID, Touch ID ou Windows Hello
          </p>
        </div>
      </div>

      {!user ? (
        <Alert>
          <Fingerprint className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para gerenciar suas passkeys.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <PasskeyManager />
          
          <Alert>
            <Fingerprint className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona:</strong> Passkeys são uma forma segura de login que usa 
              a biometria do seu dispositivo (Face ID, Touch ID, Windows Hello) em vez de senhas. 
              Uma vez registrada, você pode fazer login apenas confirmando sua identidade biométrica.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
