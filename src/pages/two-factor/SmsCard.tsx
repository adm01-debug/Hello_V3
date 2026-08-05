import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, CheckCircle, Phone as PhoneIcon, MessageSquare } from 'lucide-react';

interface Props {
  hasPhone: boolean;
  enrolling: boolean;
  verifying: boolean;
  enrollmentActive: boolean;
  phoneNumber: string;
  onPhoneChange: (v: string) => void;
  verificationCode: string;
  onVerificationCodeChange: (v: string) => void;
  onStart: () => void;
  onVerify: () => void;
}

export function SmsCard({
  hasPhone,
  enrolling,
  verifying,
  enrollmentActive,
  phoneNumber,
  onPhoneChange,
  verificationCode,
  onVerificationCodeChange,
  onStart,
  onVerify,
}: Props) {
  return (
    <Card className={hasPhone ? 'border-success/30 bg-success/5' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS (Código por Mensagem)
          {hasPhone && <ShieldCheck className="h-4 w-4 text-success ml-auto" />}
        </CardTitle>
        <CardDescription>Receba códigos de verificação por SMS</CardDescription>
      </CardHeader>
      <CardContent>
        {enrollmentActive ? (
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
        ) : hasPhone ? (
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-6 w-6 text-success" />
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
                onChange={(e) => onPhoneChange(e.target.value)}
              />
            </div>
            <Button onClick={onStart} disabled={enrolling} className="w-full">
              {enrolling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PhoneIcon className="mr-2 h-4 w-4" />
              )}
              Configurar SMS
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
