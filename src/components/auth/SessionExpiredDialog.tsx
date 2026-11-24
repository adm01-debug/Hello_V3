import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSessionExpiry } from '@/contexts/SessionExpiryContext';

/**
 * Diálogo único de sessão expirada.
 *
 * Fica por cima da rota atual de propósito: a tela e o que o usuário digitou
 * continuam montados enquanto ele se reautentica. Navegar para `/login` aqui
 * destruiria o formulário — é exatamente o que esta etapa corrige.
 */
export function SessionExpiredDialog() {
  const { expired, busy, reauthenticate, abandon } = useSessionExpiry();
  const { user } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expired) {
      setEmail(user?.email ?? '');
      setError(null);
    }
  }, [expired, user?.email]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const message = await reauthenticate(email, password);
    if (message) {
      setError(message);
      return;
    }
    setPassword('');
  };

  return (
    <Dialog open={expired} onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Sua sessão expirou</DialogTitle>
          <DialogDescription>
            Entre novamente para continuar. O que você digitou continua nesta tela e não será perdido.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-expired-email">E-mail</Label>
            <Input
              id="session-expired-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-expired-password">Senha</Label>
            <Input
              id="session-expired-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="ghost" onClick={abandon} disabled={busy}>
              Sair
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar novamente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
