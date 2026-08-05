import { useState } from 'react';
import { Mic, ShieldCheck, ShieldAlert, Trash2, CheckCircle2, AlertTriangle, Loader2, FileSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

import { ptBR } from 'date-fns/locale';
import { useVoicePrints, useFraudSignals, useRedactCall, type VerifyResult } from '@/hooks/useVoiceBiometrics';
import { usePageTitle } from '@/hooks/usePageTitle';
import { safeFormatDatePtBR } from "@/lib/safe-date";

const SEVERITY_COLOR: Record<string, string> = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function VoiceSecurity() {
  usePageTitle('Voice Security');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [redactSessionId, setRedactSessionId] = useState('');

  const { voicePrints, isLoading, isCapturing, enroll, isEnrolling, verify, isVerifying, remove } = useVoicePrints();
  const { data: fraudSignals, isLoading: loadingFraud } = useFraudSignals({ limit: 50 });
  const redact = useRedactCall();

  const handleVerify = async () => {
    const r = await verify({});
    setVerifyResult(r);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Voice Security
          </h1>
          <p className="text-muted-foreground">
            Biometria de voz, detecção de fraude e redação de informações sensíveis
          </p>
        </div>
      </div>

      <Tabs defaultValue="enrollment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrollment">Enrolamento</TabsTrigger>
          <TabsTrigger value="fraud">Sinais de Fraude</TabsTrigger>
          <TabsTrigger value="redaction">Redação PCI</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment" className="space-y-4">
          <Card className="p-5 bg-card/60 backdrop-blur border-primary/20">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" /> Cadastrar / Verificar Voz
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              O enrolamento captura 3 amostras de 4 segundos para criar seu perfil biométrico.
              A verificação compara uma amostra ao vivo com o perfil cadastrado.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => enroll({ samples: 3 })} disabled={isEnrolling || isCapturing} className="gap-2">
                {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                Cadastrar minha voz
              </Button>
              <Button variant="outline" onClick={handleVerify} disabled={isVerifying || isCapturing} className="gap-2">
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verificar voz
              </Button>
            </div>
            {verifyResult && (
              <div
                className={`mt-4 rounded-md border p-3 text-sm space-y-1 ${
                  verifyResult.match
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {verifyResult.match ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  {verifyResult.match ? 'Voz verificada' : 'Voz não confere'}
                </div>
                {typeof verifyResult.confidence === 'number' && (
                  <p>Confiança: <span className="font-semibold">{verifyResult.confidence}%</span></p>
                )}
                {verifyResult.message && <p className="text-xs">{verifyResult.message}</p>}
              </div>
            )}
          </Card>

          <Card className="p-5 bg-card/60 backdrop-blur border-primary/20">
            <h2 className="font-semibold mb-3">Suas Voice Prints</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-md" />
                ))}
              </div>
            ) : voicePrints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma voice print cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {voicePrints.map((vp) => (
                  <div
                    key={vp.id}
                    className="flex items-center justify-between rounded-md border border-primary/20 bg-background/50 p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{vp.label}</Badge>
                        {vp.is_active && <Badge className="bg-success/20 text-success border-success/30">ativa</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {vp.sample_count} amostra{vp.sample_count === 1 ? '' : 's'} · baseline{' '}
                        {(Number(vp.confidence_baseline) * 100).toFixed(0)}% · cadastrada em{' '}
                        {safeFormatDatePtBR(vp.enrolled_at, 'dd/MM/yyyy HH:mm')}
                      </p>
                      {vp.last_verified_at && (
                        <p className="text-xs text-muted-foreground">
                          Última verificação: {safeFormatDatePtBR(vp.last_verified_at, 'dd/MM HH:mm')}
                        </p>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(vp.id)} title="Remover">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card className="p-5 bg-card/60 backdrop-blur border-primary/20">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" /> Sinais de Fraude (50 mais recentes)
            </h2>
            {loadingFraud ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-md" />
                ))}
              </div>
            ) : !fraudSignals || fraudSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum sinal de fraude registrado.
              </p>
            ) : (
              <div className="space-y-2">
                {fraudSignals.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-md border p-3 text-sm space-y-1 ${SEVERITY_COLOR[s.severity] ?? ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.signal_type}</span>
                      <Badge variant="outline" className="text-xs">
                        risk {s.risk_score}
                      </Badge>
                    </div>
                    {s.description && <p className="text-xs">{s.description}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {safeFormatDatePtBR(s.created_at, "dd/MM/yyyy HH:mm")}
                      {s.agent_name && ` · agente ${s.agent_name}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="redaction" className="space-y-4">
          <Card className="p-5 bg-card/60 backdrop-blur border-primary/20">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> Redação de Informações Sensíveis
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Detecta e marca CPF, cartão, CVV, CNPJ, CEP e telefones em uma transcrição,
              gerando um log de auditoria com os timestamps dos segmentos sensíveis.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="ID da call_session"
                value={redactSessionId}
                onChange={(e) => setRedactSessionId(e.target.value)}
              />
              <Button
                onClick={() => redact.mutate(redactSessionId)}
                disabled={!redactSessionId || redact.isPending}
                className="gap-2"
              >
                {redact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Redatar
              </Button>
            </div>
            {redact.data && (
              <div className="mt-3 rounded-md border border-primary/20 bg-background/50 p-3 text-sm">
                <p>
                  <strong>{redact.data.matches}</strong> matches em <strong>{redact.data.segments_count}</strong>{' '}
                  segmento(s)
                </p>
                <pre className="text-xs text-muted-foreground mt-2">
                  {JSON.stringify(redact.data.patterns, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
