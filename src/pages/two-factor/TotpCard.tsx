import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, Smartphone, Key, Copy, CheckCircle, QrCode } from 'lucide-react';

interface Props {
  hasTOTP: boolean;
  enrolling: boolean;
  verifying: boolean;
  enrollment: { qrCode?: string; secret?: string } | null;
  verificationCode: string;
  onVerificationCodeChange: (v: string) => void;
  onStart: () => void;
  onVerify: () => void;
  onCopy: (text: string) => void;
}

export function TotpCard({
  hasTOTP,
  enrolling,
  verifying,
  enrollment,
  verificationCode,
  onVerificationCodeChange,
  onStart,
  onVerify,
  onCopy,
}: Props) {
  return (
    <Card className={hasTOTP ? 'border-info/30 bg-info/5' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Aplicativo Autenticador (TOTP)
          {hasTOTP && <ShieldCheck className="h-4 w-4 text-info ml-auto" />}
        </CardTitle>
        <CardDescription>Use um aplicativo como Google Authenticator ou Authy</CardDescription>
      </CardHeader>
      <CardContent>
        {enrollment ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
              <img src={enrollment.qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="font-mono text-sm">{enrollment.secret}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => enrollment.secret && onCopy(enrollment.secret)}
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
                  onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl font-mono tracking-widest"
                />
                <Button onClick={onVerify} disabled={verificationCode.length !== 6 || verifying}>
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : hasTOTP ? (
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-6 w-6 text-info" />
            <div className="flex-1">
              <p className="font-medium">TOTP Ativo</p>
              <p className="text-sm text-muted-foreground">Autenticador configurado</p>
            </div>
          </div>
        ) : (
          <Button onClick={onStart} disabled={enrolling} className="w-full">
            {enrolling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="mr-2 h-4 w-4" />
            )}
            Configurar Autenticador
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
