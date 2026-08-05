import { useState } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Loader2,
  Shield,
  Smartphone,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TotpCard } from './two-factor/TotpCard';
import { SmsCard } from './two-factor/SmsCard';
import { BackupCodesCard } from './two-factor/BackupCodesCard';
import { DevicesCard } from './two-factor/DevicesCard';

type EnrollmentType = 'totp' | 'phone';

interface EnrollmentState {
  type: EnrollmentType;
  factorId?: string;
  qrCode?: string;
  secret?: string;
}

export default function TwoFactorAuth() {
  usePageTitle('Autenticação 2FA');
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

  const [enrollmentData, setEnrollmentData] = useState<EnrollmentState | null>(null);
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
      setBackupCodes(generateBackupCodes());
    }
  };

  const startPhoneEnrollment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }
    const result = await enrollPhone(phoneNumber);
    if (result) {
      setEnrollmentData({ type: 'phone', factorId: result.factorId });
    }
  };

  const verifyAndEnable = async () => {
    if (!enrollmentData?.factorId || verificationCode.length !== 6) return;
    setVerifying(true);
    const success = await verifyFactor(enrollmentData.factorId, verificationCode);
    if (success) {
      await saveSettings({
        mfa_enabled: true,
        mfa_method:
          enrollmentData.type === 'totp' && hasPhone
            ? 'both'
            : enrollmentData.type === 'phone' && hasTOTP
              ? 'both'
              : enrollmentData.type,
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
    if (!success) return;
    const remainingFactors = factors.filter((f) => f.id !== factorId && f.status === 'verified');
    if (remainingFactors.length === 0) {
      await saveSettings({ mfa_enabled: false, mfa_method: null });
    } else {
      const hasRemainingTOTP = remainingFactors.some((f) => f.type === 'totp');
      const hasRemainingPhone = remainingFactors.some((f) => f.type === 'phone');
      await saveSettings({
        mfa_method:
          hasRemainingTOTP && hasRemainingPhone
            ? 'both'
            : hasRemainingTOTP
              ? 'totp'
              : 'phone',
      });
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

  const displayedBackupCodes =
    backupCodes.length > 0 || showBackupCodes
      ? backupCodes.length > 0
        ? backupCodes
        : settings?.backup_codes || []
      : settings?.backup_codes || [];

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
            <Badge variant="default" className="bg-info">
              <Smartphone className="h-3 w-3 mr-1" />
              TOTP
            </Badge>
          )}
          {hasPhone && (
            <Badge variant="default" className="bg-success">
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
          <TotpCard
            hasTOTP={hasTOTP}
            enrolling={enrolling}
            verifying={verifying}
            enrollment={
              enrollmentData?.type === 'totp'
                ? { qrCode: enrollmentData.qrCode, secret: enrollmentData.secret }
                : null
            }
            verificationCode={verificationCode}
            onVerificationCodeChange={setVerificationCode}
            onStart={startTOTPEnrollment}
            onVerify={verifyAndEnable}
            onCopy={copyToClipboard}
          />
          <SmsCard
            hasPhone={hasPhone}
            enrolling={enrolling}
            verifying={verifying}
            enrollmentActive={enrollmentData?.type === 'phone'}
            phoneNumber={phoneNumber}
            onPhoneChange={setPhoneNumber}
            verificationCode={verificationCode}
            onVerificationCodeChange={setVerificationCode}
            onStart={startPhoneEnrollment}
            onVerify={verifyAndEnable}
          />
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <BackupCodesCard codes={displayedBackupCodes} onCopy={copyToClipboard} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <DevicesCard factors={factors} onDisable={handleDisableFactor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
