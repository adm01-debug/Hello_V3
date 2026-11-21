import { useState } from 'react';
import { useSurveys } from '@/hooks/useSurveys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Star } from 'lucide-react';
import { safeToLocaleDateString } from '@/lib/safe-date';

export function SurveysPanel() {
  const { responses, loading, sendSurvey, npsScore } = useSurveys();
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState('whatsapp');

  const handleSend = () => {
    sendSurvey({ survey_id: 'nps', contact_id: contactId.trim() || undefined, channel });
    setContactId('');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">NPS</p>
            <p className="text-2xl font-bold">{npsScore ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Respostas</p>
            <p className="text-2xl font-bold">{responses.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />Enviar Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input placeholder="ID do contato (opcional)" value={contactId} onChange={(e) => setContactId(e.target.value)} className="max-w-xs" />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="h-10 rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">E-mail</option>
          </select>
          <Button onClick={handleSend}>Enviar</Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : responses.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma resposta de pesquisa registrada.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {responses.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="font-medium flex items-center gap-2">
                    {r.channel}
                    {typeof r.score === 'number' && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3" /> {r.score}/10
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {r.free_text_feedback ?? r.category ?? 'Sem feedback'}
                  </p>
                </div>
                <Badge variant="secondary">{safeToLocaleDateString(r.submitted_at)}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}