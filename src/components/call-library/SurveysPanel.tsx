import { useEffect, useState } from 'react';
import { useSurveys, useSurveyDefinitions } from '@/hooks/useSurveys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { safeToLocaleDateString } from '@/lib/safe-date';

export function SurveysPanel() {
  const { responses, loading, sendSurvey, npsScore } = useSurveys();
  const {
    surveys,
    loading: surveysLoading,
    createSurvey,
    deactivateSurvey,
  } = useSurveyDefinitions();
  const [surveyId, setSurveyId] = useState('');
  const [newSurveyName, setNewSurveyName] = useState('');
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!surveyId && surveys.length > 0) setSurveyId(surveys[0].id);
    if (surveyId && !surveys.some((s) => s.id === surveyId)) setSurveyId(surveys[0]?.id ?? '');
  }, [surveys, surveyId]);

  const handleCreateSurvey = async () => {
    const name = newSurveyName.trim();
    if (!name) {
      toast.error('Informe o nome da pesquisa');
      return;
    }
    const created = await createSurvey(name);
    if (created?.id) setSurveyId(created.id);
    setNewSurveyName('');
  };

  const handleSend = async () => {
    if (sending) return;
    if (!surveyId) {
      toast.error('Cadastre e selecione uma pesquisa antes de enviar');
      return;
    }
    setSending(true);
    try {
      await sendSurvey({ survey_id: surveyId, contact_id: contactId.trim() || undefined, channel });
      setContactId('');
    } finally { setSending(false); }
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
          <select
            aria-label="Pesquisa a enviar"
            value={surveyId}
            onChange={(e) => setSurveyId(e.target.value)}
            disabled={surveysLoading || surveys.length === 0}
            className="h-10 rounded-md border bg-transparent px-3 text-sm"
          >
            {surveys.length === 0 ? (
              <option value="">Nenhuma pesquisa ativa</option>
            ) : (
              surveys.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))
            )}
          </select>
          <Input
            aria-label="ID do contato"
            placeholder="ID do contato (opcional)"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="max-w-xs"
          />
          <select
            aria-label="Canal de envio"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="h-10 rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">E-mail</option>
          </select>
          <Button onClick={handleSend} disabled={sending || !surveyId}>Enviar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pesquisas cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {surveysLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : surveys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma pesquisa ativa. Crie uma pesquisa para poder enviá-la.
            </p>
          ) : (
            <ul className="space-y-2">
              {surveys.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                  <span className="min-w-0 truncate">
                    {s.name}
                    <Badge variant="secondary" className="ml-2">{s.survey_type.toUpperCase()}</Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive"
                    aria-label={`Desativar pesquisa ${s.name}`}
                    onClick={() => deactivateSurvey(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Desativar
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="Nome da nova pesquisa"
              placeholder="Nome da nova pesquisa (ex.: NPS pós-chamada)"
              value={newSurveyName}
              onChange={(e) => setNewSurveyName(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={handleCreateSurvey}>Nova pesquisa</Button>
          </div>
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