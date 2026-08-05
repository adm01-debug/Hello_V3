import { useState } from 'react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fingerprint, Loader2 } from 'lucide-react';

interface PasskeyLoginProps {
  onSuccess?: () => void;
  showEmailField?: boolean;
}

export function PasskeyLogin({ onSuccess, showEmailField = true }: PasskeyLoginProps) {
  const { isSupported, isPlatformAvailable, isAuthenticating, authenticateWithPasskey } = useWebAuthn();
  const [email, setEmail] = useState('');

  if (!isSupported) {
    return null;
  }

  const handlePasskeyLogin = async () => {
    const result = await authenticateWithPasskey(email || undefined);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      {showEmailField && (
        <div className="space-y-2">
          <Label htmlFor="passkey-email">Email (opcional)</Label>
          <Input
            id="passkey-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para usar qualquer passkey registrada neste dispositivo
          </p>
        </div>
      )}
      
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handlePasskeyLogin}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {isAuthenticating ? 'Autenticando...' : 'Entrar com Passkey'}
      </Button>

      {isPlatformAvailable && (
        <p className="text-xs text-center text-muted-foreground">
          Use Face ID, Touch ID ou Windows Hello
        </p>
      )}
    </div>
  );
}
