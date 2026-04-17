import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, RefreshCw, Copy, Edit3, Save, X, AlertCircle,
  CheckCircle2, ListChecks, MessageSquareQuote, ArrowRight, Smile, Meh, Frown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMeetingSummary, type ActionItem, type ParticipantSentiment } from '@/hooks/useMeetingSummary';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  callSessionId: string;
  className?: string;
}

const sentimentIcon = (s: ParticipantSentiment['sentiment']) =>
  s === 'positive' ? <Smile className="h-4 w-4 text-success" /> :
  s === 'negative' ? <Frown className="h-4 w-4 text-destructive" /> :
  <Meh className="h-4 w-4 text-muted-foreground" />;

const priorityColor = (p: ActionItem['priority']) =>
  p === 'high' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  p === 'medium' ? 'bg-warning/15 text-warning border-warning/30' :
  'bg-muted text-muted-foreground border-border';

export function MeetingSummaryCard({ callSessionId, className }: Props) {
  const { summary, isLoading, isGenerating, generate, updateContent } = useMeetingSummary(callSessionId);
  const [editing, setEditing] = useState(false);
  const [draftSummary, setDraftSummary] = useState('');

  if (isLoading) {
    return (
      <Card className={cn('p-4 bg-card/50 backdrop-blur border-primary/20', className)}>
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!summary || summary.status === 'failed') {
    return (
      <Card className={cn('p-6 bg-card/50 backdrop-blur border-primary/20 flex flex-col items-center text-center gap-3', className)}>
        <Sparkles className="h-10 w-10 text-primary" />
        <h3 className="font-semibold">
          {summary?.status === 'failed' ? 'Falha ao gerar resumo' : 'Sem resumo IA ainda'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {summary?.error_message ||
            'Gere notas executivas automáticas com pontos-chave, ações, decisões e sentimento por participante.'}
        </p>
        <Button onClick={() => generate(true)} disabled={isGenerating} className="gap-2">
          {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? 'Gerando...' : 'Gerar resumo IA'}
        </Button>
      </Card>
    );
  }

  if (summary.status === 'generating' || isGenerating) {
    return (
      <Card className={cn('p-6 bg-card/50 backdrop-blur border-primary/20 flex flex-col items-center gap-3', className)}>
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-medium">Gerando resumo executivo...</p>
        <p className="text-xs text-muted-foreground">A IA está analisando a transcrição</p>
      </Card>
    );
  }

  const copyAll = () => {
    const text = [
      `RESUMO\n${summary.summary ?? ''}`,
      summary.key_points.length ? `\nPONTOS-CHAVE\n${summary.key_points.map(k => `• ${k}`).join('\n')}` : '',
      summary.action_items.length ? `\nAÇÕES\n${summary.action_items.map(a => `• [${a.priority.toUpperCase()}] ${a.description}${a.owner ? ` (${a.owner})` : ''}`).join('\n')}` : '',
      summary.decisions.length ? `\nDECISÕES\n${summary.decisions.map(d => `• ${d}`).join('\n')}` : '',
      summary.next_steps.length ? `\nPRÓXIMOS PASSOS\n${summary.next_steps.map(n => `• ${n}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Resumo copiado');
  };

  const saveEdit = () => {
    updateContent({ summary: draftSummary });
    setEditing(false);
  };

  return (
    <Card className={cn('bg-card/50 backdrop-blur border-primary/20 overflow-hidden', className)}>
      <div className="flex items-center justify-between p-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">Resumo IA</h3>
            <p className="text-xs text-muted-foreground truncate">
              {summary.ai_model} · {format(new Date(summary.generated_at), 'dd/MM HH:mm', { locale: ptBR })}
              {summary.edited && ' · editado'}
              {summary.ai_confidence != null && ` · ${Math.round(summary.ai_confidence * 100)}% confiança`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {summary.follow_up_required && (
            <Badge variant="outline" className="border-warning/40 text-warning text-xs gap-1">
              <AlertCircle className="h-3 w-3" /> Follow-up
            </Badge>
          )}
          <Button size="sm" variant="ghost" onClick={copyAll} title="Copiar">
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => generate(true)} disabled={isGenerating} title="Regenerar">
            <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent px-4 h-10">
          <TabsTrigger value="summary" className="gap-1.5 text-xs"><MessageSquareQuote className="h-3 w-3" /> Resumo</TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5 text-xs">
            <ListChecks className="h-3 w-3" /> Ações
            {summary.action_items.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">{summary.action_items.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decisions" className="gap-1.5 text-xs"><CheckCircle2 className="h-3 w-3" /> Decisões</TabsTrigger>
          <TabsTrigger value="sentiment" className="gap-1.5 text-xs"><Smile className="h-3 w-3" /> Sentimento</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="p-4 space-y-3 mt-0">
          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                rows={8}
                className="text-sm bg-background/50"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
                <Button size="sm" onClick={saveEdit} className="gap-1"><Save className="h-3 w-3" /> Salvar</Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-64">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
              </ScrollArea>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => { setDraftSummary(summary.summary ?? ''); setEditing(true); }}>
                  <Edit3 className="h-3 w-3" /> Editar
                </Button>
              </div>
            </>
          )}
          {summary.key_points.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Pontos-chave</h4>
              <ul className="space-y-1.5">
                {summary.key_points.map((k, i) => (
                  <li key={i} className="text-sm flex gap-2"><span className="text-primary">▸</span><span>{k}</span></li>
                ))}
              </ul>
            </div>
          )}
          {summary.topics_discussed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
              {summary.topics_discussed.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="p-4 mt-0 space-y-2">
          {summary.action_items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação identificada</p>
          ) : summary.action_items.map((a, i) => (
            <div key={i} className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1">{a.description}</p>
                <Badge variant="outline" className={cn('text-[10px] shrink-0', priorityColor(a.priority))}>
                  {a.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {a.owner && <span>👤 {a.owner}</span>}
                {a.due_suggestion && <span>📅 {a.due_suggestion}</span>}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="decisions" className="p-4 mt-0 space-y-3">
          {summary.decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma decisão registrada</p>
          ) : (
            <ul className="space-y-1.5">
              {summary.decisions.map((d, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}
          {summary.next_steps.length > 0 && (
            <div className="pt-3 border-t border-border/40">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Próximos passos</h4>
              <ul className="space-y-1.5">
                {summary.next_steps.map((n, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.follow_up_required && summary.follow_up_reason && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
              <p className="font-medium text-warning mb-1">Follow-up necessário</p>
              <p className="text-muted-foreground">{summary.follow_up_reason}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sentiment" className="p-4 mt-0 space-y-2">
          {summary.participants_sentiment.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem análise de sentimento</p>
          ) : summary.participants_sentiment.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="flex items-center gap-2">
                {sentimentIcon(p.sentiment)}
                <span className="text-sm font-medium capitalize">{p.speaker}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] capitalize">{p.sentiment}</Badge>
                <span className="text-sm font-mono w-10 text-right">{p.score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
