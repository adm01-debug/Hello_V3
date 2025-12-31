import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Loader2, Shield, ShieldCheck, Smartphone, Key, Copy, 
  RefreshCw, CheckCircle, AlertTriangle, QrCode 
} from 'lucide-react';

interface MFAFactor {
  id: string;
  type: string;
  status: string;
  friendly_name?: string;
}

export default function TwoFactorAuth() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    loadMFAFactors();
  }, []);

  const loadMFAFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data.totp || []);
    } catch (error) {
      console.error('Error loading MFA factors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'CallCenter Pro Authenticator',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      
      // Gerar códigos de backup
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(codes);
      
    } catch (error: any) {
      toast.error('Erro ao iniciar configuração', {
        description: error.message,
      });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || verificationCode.length !== 6) return;
    
    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      // Salvar códigos de backup no banco
      await supabase.from('user_mfa_settings').upsert({
        user_id: user?.id,
        mfa_enabled: true,
        mfa_method: 'totp',
        backup_codes: backupCodes,
        last_verified_at: new Date().toISOString(),
      });

      toast.success('MFA ativado com sucesso!');
      setShowBackupCodes(true);
      setQrCode(null);
      await loadMFAFactors();
      
    } catch (error: any) {
      toast.error('Código inválido', {
        description: 'Verifique o código e tente novamente.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const disableMFA = async (factor: MFAFactor) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (error) throw error;

      await supabase.from('user_mfa_settings')
        .update({ mfa_enabled: false })
        .eq('user_id', user?.id);

      toast.success('MFA desativado');
      await loadMFAFactors();
    } catch (error: any) {
      toast.error('Erro ao desativar MFA', {
        description: error.message,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const hasActiveMFA = factors.some(f => f.status === 'verified');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Autenticação de Dois Fatores (2FA)
          </h1>
          <p className="text-muted-foreground mt-1">
            Adicione uma camada extra de segurança à sua conta
          </p>
        </div>
        <Badge variant={hasActiveMFA ? 'default' : 'secondary'}>
          {hasActiveMFA ? (
            <>
              <ShieldCheck className="h-3 w-3 mr-1" />
              Ativo
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inativo
            </>
          )}
        </Badge>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Configuração</TabsTrigger>
          <TabsTrigger value="backup">Códigos de Backup</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          {hasActiveMFA ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">2FA Ativo</h3>
                    <p className="text-sm text-muted-foreground">
                      Sua conta está protegida com autenticação de dois fatores
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => factors[0] && disableMFA(factors[0])}
                  >
                    Desativar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : qrCode ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Configurar Autenticador
                </CardTitle>
                <CardDescription>
                  Escaneie o QR Code com seu aplicativo autenticador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
                  <img 
                    src={qrCode} 
                    alt="QR Code para configuração do 2FA"
                    className="w-48 h-48"
                  />
                </div>

                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span className="font-mono text-sm">{secret}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => secret && copyToClipboard(secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="code">Código de Verificação</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <Button 
                      onClick={verifyAndEnable}
                      disabled={verificationCode.length !== 6 || verifying}
                    >
                      {verifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite o código de 6 dígitos do seu aplicativo autenticador
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ativar 2FA</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Use um aplicativo autenticador como Google Authenticator, 
                      Authy ou Microsoft Authenticator para gerar códigos de acesso.
                    </p>
                  </div>
                  <Button onClick={startEnrollment} disabled={enrolling}>
                    {enrolling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Configurar Autenticador
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Códigos de Backup
              </CardTitle>
              <CardDescription>
                Use estes códigos para acessar sua conta caso perca acesso ao autenticador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showBackupCodes || backupCodes.length > 0 ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Guarde estes códigos em um local seguro. Cada código só pode ser usado uma vez.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                        <span>{code}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Todos os Códigos
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ative o 2FA para gerar códigos de backup</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Dispositivos Autenticadores
              </CardTitle>
              <CardDescription>
                Gerencie os dispositivos configurados para 2FA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {factors.length > 0 ? (
                <div className="space-y-2">
                  {factors.map((factor) => (
                    <div 
                      key={factor.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {factor.friendly_name || 'Autenticador'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {factor.type.toUpperCase()} • {factor.status}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => disableMFA(factor)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dispositivo configurado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
