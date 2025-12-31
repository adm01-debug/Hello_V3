import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMFA } from '@/hooks/useMFA';
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
  CheckCircle, AlertTriangle, QrCode, Phone as PhoneIcon,
  MessageSquare
} from 'lucide-react';

export default function TwoFactorAuth() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const {
    factors,
    settings,
    isLoading,
    enrolling,
    hasActiveMFA,
    hasTOTP,
    hasPhone,
    enrollTOTP,
    enrollPhone,
    verifyFactor,
    unenrollFactor,
    generateBackupCodes,
    saveSettings,
  } = useMFA();

  const [enrollmentData, setEnrollmentData] = useState<{
    type: 'totp' | 'phone';
    factorId?: string;
    qrCode?: string;
    secret?: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const startTOTPEnrollment = async () => {
    const result = await enrollTOTP('CallCenter Pro Authenticator');
    if (result) {
      setEnrollmentData({
        type: 'totp',
        factorId: result.factorId,
        qrCode: result.qrCode,
        secret: result.secret,
      });
      const codes = generateBackupCodes();
      setBackupCodes(codes);
    }
  };

  const startPhoneEnrollment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }
    const result = await enrollPhone(phoneNumber);
    if (result) {
      setEnrollmentData({
        type: 'phone',
        factorId: result.factorId,
      });
    }
  };

  const verifyAndEnable = async () => {
    if (!enrollmentData?.factorId || verificationCode.length !== 6) return;
    
    setVerifying(true);
    const success = await verifyFactor(enrollmentData.factorId, verificationCode);
    
    if (success) {
      await saveSettings({
        mfa_enabled: true,
        mfa_method: enrollmentData.type === 'totp' && hasPhone ? 'both' : 
                    enrollmentData.type === 'phone' && hasTOTP ? 'both' : 
                    enrollmentData.type,
        backup_codes: backupCodes.length > 0 ? backupCodes : settings?.backup_codes || [],
        last_verified_at: new Date().toISOString(),
      });
      
      toast.success('MFA ativado com sucesso!');
      setShowBackupCodes(true);
      setEnrollmentData(null);
      setVerificationCode('');
    }
    setVerifying(false);
  };

  const handleDisableFactor = async (factorId: string) => {
    const success = await unenrollFactor(factorId);
    if (success) {
      const remainingFactors = factors.filter(f => f.id !== factorId && f.status === 'verified');
      if (remainingFactors.length === 0) {
        await saveSettings({ mfa_enabled: false, mfa_method: null });
      } else {
        const hasRemainingTOTP = remainingFactors.some(f => f.type === 'totp');
        const hasRemainingPhone = remainingFactors.some(f => f.type === 'phone');
        await saveSettings({
          mfa_method: hasRemainingTOTP && hasRemainingPhone ? 'both' : 
                      hasRemainingTOTP ? 'totp' : 'phone',
        });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

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
            Configure múltiplos métodos de autenticação para máxima segurança
          </p>
        </div>
        <div className="flex gap-2">
          {hasTOTP && (
            <Badge variant="default" className="bg-blue-500">
              <Smartphone className="h-3 w-3 mr-1" />
              TOTP
            </Badge>
          )}
          {hasPhone && (
            <Badge variant="default" className="bg-green-500">
              <MessageSquare className="h-3 w-3 mr-1" />
              SMS
            </Badge>
          )}
          {!hasActiveMFA && (
            <Badge variant="secondary">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inativo
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Configuração</TabsTrigger>
          <TabsTrigger value="backup">Códigos de Backup</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          {/* TOTP Setup Card */}
          <Card className={hasTOTP ? 'border-blue-500/30 bg-blue-500/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Aplicativo Autenticador (TOTP)
                {hasTOTP && <ShieldCheck className="h-4 w-4 text-blue-500 ml-auto" />}
              </CardTitle>
              <CardDescription>
                Use um aplicativo como Google Authenticator ou Authy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentData?.type === 'totp' ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
                    <img 
                      src={enrollmentData.qrCode} 
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span className="font-mono text-sm">{enrollmentData.secret}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => enrollmentData.secret && copyToClipboard(enrollmentData.secret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label>Código de Verificação</Label>
                    <div className="flex gap-2">
                      <Input
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
                        {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : hasTOTP ? (
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">TOTP Ativo</p>
                    <p className="text-sm text-muted-foreground">Autenticador configurado</p>
                  </div>
                </div>
              ) : (
                <Button onClick={startTOTPEnrollment} disabled={enrolling} className="w-full">
                  {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                  Configurar Autenticador
                </Button>
              )}
            </CardContent>
          </Card>

          {/* SMS Setup Card */}
          <Card className={hasPhone ? 'border-green-500/30 bg-green-500/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS (Código por Mensagem)
                {hasPhone && <ShieldCheck className="h-4 w-4 text-green-500 ml-auto" />}
              </CardTitle>
              <CardDescription>
                Receba códigos de verificação por SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentData?.type === 'phone' ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Um código foi enviado para {phoneNumber}
                  </p>
                  <div className="space-y-2">
                    <Label>Código de Verificação</Label>
                    <div className="flex gap-2">
                      <Input
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
                        {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : hasPhone ? (
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">SMS Ativo</p>
                    <p className="text-sm text-muted-foreground">Verificação por SMS configurada</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Número de Telefone</Label>
                    <Input
                      type="tel"
                      placeholder="+55 11 99999-9999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <Button onClick={startPhoneEnrollment} disabled={enrolling} className="w-full">
                    {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneIcon className="mr-2 h-4 w-4" />}
                    Configurar SMS
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Códigos de Backup
              </CardTitle>
              <CardDescription>
                Use estes códigos caso perca acesso aos seus dispositivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showBackupCodes || backupCodes.length > 0 || (settings?.backup_codes?.length || 0) > 0 ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                    {(backupCodes.length > 0 ? backupCodes : settings?.backup_codes || []).map((code, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                        <span>{code}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard((backupCodes.length > 0 ? backupCodes : settings?.backup_codes || []).join('\n'))}
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
                Fatores de Autenticação Configurados
              </CardTitle>
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
                        {factor.type === 'totp' ? (
                          <Smartphone className="h-5 w-5 text-blue-500" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {factor.friendly_name || (factor.type === 'totp' ? 'Autenticador' : 'SMS')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {factor.type.toUpperCase()} • {factor.status === 'verified' ? 'Verificado' : 'Pendente'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDisableFactor(factor.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum fator de autenticação configurado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
