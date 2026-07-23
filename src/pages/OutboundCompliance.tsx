import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, Clock, Sparkles, FileText, RefreshCw, Phone, CheckCircle2, XCircle } from 'lucide-react';

import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useConsent, type ConsentChannel, type ConsentType } from '@/hooks/useConsent';
import { useBestTimeToContact } from '@/hooks/useBestTimeToContact';
import { useCallScoring, type CallScoreResult } from '@/hooks/useCallScoring';
import { recommendationLabel, recommendationColor } from '@/lib/outbound-scoring';
import { toast } from 'sonner';
import { safeFormatDatePtBR } from "@/lib/safe-date";

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function OutboundCompliance() {
  usePageTitle('Outbound Compliance & Score Preditivo');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Outbound Compliance & Engagement</h1>
          <p className="text-muted-foreground">
            Gestão de consentimento, melhor janela de contato e score preditivo de atendimento
          </p>
        </div>
      </div>

      <Tabs defaultValue="consents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="consents" className="gap-2"><FileText className="h-4 w-4" /> Consentimentos</TabsTrigger>
          <TabsTrigger value="best-times" className="gap-2"><Clock className="h-4 w-4" /> Melhores Horários</TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2"><Sparkles className="h-4 w-4" /> Score Preditivo</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><ShieldCheck className="h-4 w-4" /> Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="consents"><ConsentsTab /></TabsContent>
        <TabsContent value="best-times"><BestTimesTab /></TabsContent>
        <TabsContent value="scoring"><ScoringTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ConsentsTab() {
  const { records, isLoading, recordConsent, isRecording } = useConsent();
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<ConsentChannel>('voice');
  const [consentType, setConsentType] = useState<ConsentType>('marketing');
  const [granted, setGranted] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!phone.trim()) { toast.error('Telefone obrigatório'); return; }
    recordConsent({ phone, channel, consent_type: consentType, granted, notes: notes || undefined });
    setPhone(''); setNotes('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Registrar Consentimento</CardTitle>
          <CardDescription>Capture opt-in/opt-out com audit trail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as ConsentChannel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="voice">Voz</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={consentType} onValueChange={(v) => setConsentType(v as ConsentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="transactional">Transacional</SelectItem>
                <SelectItem value="recording">Gravação</SelectItem>
                <SelectItem value="data_processing">Tratamento de dados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Decisão</Label>
            <Select value={granted ? 'granted' : 'revoked'} onValueChange={(v) => setGranted(v === 'granted')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="granted">Concedido (opt-in)</SelectItem>
                <SelectItem value="revoked">Revogado (opt-out)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
          <Button onClick={handleSubmit} disabled={isRecording} className="w-full">
            {isRecording ? 'Registrando...' : 'Registrar'}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Histórico de Consentimentos</CardTitle>
          <CardDescription>{records.length} registro(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Carregando...</p> :
            records.length === 0 ? <p className="text-muted-foreground">Nenhum registro ainda</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 30).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.phone ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline">{r.channel}</Badge></TableCell>
                    <TableCell className="text-xs">{r.consent_type}</TableCell>
                    <TableCell>
                      {r.granted ? <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Opt-in</Badge>
                        : <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Opt-out</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {safeFormatDatePtBR(r.created_at, 'dd/MM HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BestTimesTab() {
  const { topPatterns, recompute, isRecomputing } = useBestTimeToContact();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Top Contatos por Janela de Atendimento</CardTitle>
          <CardDescription>Calculado a partir do histórico de chamadas</CardDescription>
        </div>
        <Button onClick={() => recompute(undefined)} disabled={isRecomputing} variant="outline" className="gap-2">
          <RefreshCw className={isRecomputing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {isRecomputing ? 'Calculando...' : 'Recalcular tudo'}
        </Button>
      </CardHeader>
      <CardContent>
        {topPatterns.length === 0 ? <p className="text-muted-foreground">Sem padrões calculados. Clique em "Recalcular tudo" para iniciar.</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Melhor Hora</TableHead>
                <TableHead>Melhor Dia</TableHead>
                <TableHead>Taxa Atendimento</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Última tentativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPatterns.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.contact_id.slice(0, 8)}...</TableCell>
                  <TableCell>{p.best_hour !== null ? `${p.best_hour}h` : '—'}</TableCell>
                  <TableCell>{p.best_day_of_week !== null ? DAY_NAMES[p.best_day_of_week] : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={p.answer_rate > 0.5 ? 'default' : 'outline'}>
                      {(p.answer_rate * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{p.total_attempts}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.last_attempt_at ? safeFormatDatePtBR(p.last_attempt_at, 'dd/MM HH:mm') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ScoringTab() {
  const { score, isScoring } = useCallScoring();
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<CallScoreResult | null>(null);

  const handleScore = async () => {
    if (!phone.trim()) { toast.error('Informe um telefone'); return; }
    try {
      const r = await score({ phone });
      setResult(r);
    } catch (e) {
      toast.error('Falha no cálculo', { description: e instanceof Error ? e.message : 'Erro desconhecido' });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calcular Score de Tentativa</CardTitle>
          <CardDescription>Combina DNC, horário, histórico e melhor janela</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="score-phone">Telefone</Label>
            <Input id="score-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
          <Button onClick={handleScore} disabled={isScoring} className="w-full gap-2">
            <Phone className="h-4 w-4" /> {isScoring ? 'Calculando...' : 'Calcular Score'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? <p className="text-muted-foreground">Calcule um score para ver o resultado</p> : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-3xl font-bold">{(result.score * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recomendação</span>
                <Badge variant={recommendationColor(result.recommendation) as 'default' | 'secondary' | 'outline' | 'destructive'}>
                  {recommendationLabel(result.recommendation)}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Fatores</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.factors.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditTab() {
  const { records, isLoading } = useConsent();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail de Consentimentos</CardTitle>
        <CardDescription>Trilha completa de opt-ins e opt-outs (LGPD/TCPA)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Carregando...</p> :
          records.length === 0 ? <p className="text-muted-foreground">Nenhum evento registrado</p> : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {records.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm">
                {r.granted ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
                <div className="flex-1">
                  <p className="font-medium">{r.granted ? 'Opt-in' : 'Opt-out'} • {r.consent_type} • {r.channel}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.phone ?? r.contact_id?.slice(0, 8)} • por {r.recorded_by ?? 'sistema'} • {safeFormatDatePtBR(r.created_at, "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                  {r.notes && <p className="text-xs mt-1">{r.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
