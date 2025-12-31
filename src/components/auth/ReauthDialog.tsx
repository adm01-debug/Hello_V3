import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useReauth } from '@/hooks/useReauth';
import { useMFA } from '@/hooks/useMFA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Lock, Shield, Smartphone } from 'lucide-react';

interface ReauthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function ReauthDialog({
  open,
  onOpenChange,
  onSuccess,
  title = 'Confirme sua identidade',
  description = 'Para continuar, confirme sua identidade.',
}: ReauthDialogProps) {
  const { user } = useAuthContext();
  const { verifyWithPassword, verifyWithMFA, isVerifying } = useReauth();
  const { factors, hasActiveMFA } = useMFA();
  
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifiedFactors = factors.filter(f => f.status === 'verified');

  const handlePasswordSubmit = async () => {
    setError(null);
    const success = await verifyWithPassword(password);
    
    if (success) {
      setPassword('');
      onSuccess();
      onOpenChange(false);
    } else {
      setError('Senha incorreta');
    }
  };

  const handleMFASubmit = async () => {
    if (!selectedFactor) {
      setError('Selecione um fator de autenticação');
      return;
    }

    setError(null);
    const success = await verifyWithMFA(selectedFactor, mfaCode);
    
    if (success) {
      setMfaCode('');
      setSelectedFactor(null);
      onSuccess();
      onOpenChange(false);
    } else {
      setError('Código inválido');
    }
  };

  const handleCancel = () => {
    setPassword('');
    setMfaCode('');
    setSelectedFactor(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {hasActiveMFA && verifiedFactors.length > 0 ? (
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">
                <Lock className="h-4 w-4 mr-2" />
                Senha
              </TabsTrigger>
              <TabsTrigger value="mfa">
                <Smartphone className="h-4 w-4 mr-2" />
                2FA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reauth-password">Senha</Label>
                <Input
                  id="reauth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button 
                onClick={handlePasswordSubmit} 
                disabled={!password || isVerifying}
                className="w-full"
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </TabsContent>

            <TabsContent value="mfa" className="space-y-4 mt-4">
              {verifiedFactors.length > 1 && (
                <div className="space-y-2">
                  <Label>Selecione o método</Label>
                  <div className="flex gap-2">
                    {verifiedFactors.map((factor) => (
                      <Button
                        key={factor.id}
                        variant={selectedFactor === factor.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFactor(factor.id)}
                      >
                        {factor.type === 'totp' ? 'Autenticador' : 'SMS'}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Código de Verificação</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => {
                    setMfaCode(e.target.value.replace(/\D/g, ''));
                    if (!selectedFactor && verifiedFactors.length === 1) {
                      setSelectedFactor(verifiedFactors[0].id);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleMFASubmit()}
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button 
                onClick={handleMFASubmit} 
                disabled={mfaCode.length !== 6 || isVerifying}
                className="w-full"
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verificar
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reauth-password-only">Senha</Label>
              <Input
                id="reauth-password-only"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          {!hasActiveMFA && (
            <Button 
              onClick={handlePasswordSubmit} 
              disabled={!password || isVerifying}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
