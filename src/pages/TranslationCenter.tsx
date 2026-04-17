import { useEffect, useState } from 'react';
import { Languages, Globe, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { usePageTitle } from '@/hooks/usePageTitle';
import { langFlag, langLabel, SUPPORTED_LANGS } from '@/lib/language-detection';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TranslationRow {
  id: string;
  call_session_id: string;
  speaker: string;
  source_lang: string;
  target_lang: string;
  original_text: string;
  translated_text: string;
  confidence: number | null;
  latency_ms: number | null;
  created_at: string;
}

interface CulturalHint {
  id: string;
  locale: string;
  context_type: string;
  hint_text: string;
  severity: string;
}

export default function TranslationCenter() {
  usePageTitle('Centro de Tradução Multilíngue');
  const [rows, setRows] = useState<TranslationRow[]>([]);
  const [hints, setHints] = useState<CulturalHint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [rsTrans, rsHints] = await Promise.all([
          supabase.from('call_translations').select('*').order('created_at', { ascending: false }).limit(200),
          supabase.from('cultural_hints').select('*').eq('is_active', true).order('locale'),
        ]);
        if (rsTrans.error) throw rsTrans.error;
        if (rsHints.error) throw rsHints.error;
        setRows((rsTrans.data ?? []) as TranslationRow[]);
        setHints((rsHints.data ?? []) as CulturalHint[]);
      } catch (e) {
        logger.error('TranslationCenter', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = {
    total: rows.length,
    avgLatency: rows.length ? Math.round(rows.reduce((a, r) => a + (r.latency_ms ?? 0), 0) / rows.length) : 0,
    topTarget: topLang(rows.map((r) => r.target_lang)),
    topSource: topLang(rows.map((r) => r.source_lang).filter((l) => l && l !== 'auto')),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Languages className="h-7 w-7 text-primary" />
          Centro de Tradução Multilíngue
        </h1>
        <p className="text-muted-foreground">Histórico, qualidade e dicas culturais para atendimento global</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard icon={Globe} label="Traduções (recentes)" value={String(stats.total)} />
        <KpiCard icon={TrendingUp} label="Latência média" value={`${stats.avgLatency}ms`} />
        <KpiCard icon={Sparkles} label="Idioma alvo top" value={`${langFlag(stats.topTarget)} ${langLabel(stats.topTarget)}`} />
        <KpiCard icon={Sparkles} label="Idioma origem top" value={`${langFlag(stats.topSource)} ${langLabel(stats.topSource)}`} />
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="languages">Idiomas Suportados</TabsTrigger>
          <TabsTrigger value="hints">Dicas Culturais</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Últimas 200 traduções</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64" /> : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Nenhuma tradução ainda. Inicie uma chamada e use o painel de tradução ao vivo.</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {rows.map((r) => (
                      <div key={r.id} className="rounded border p-3 text-sm space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{r.speaker === 'agent' ? 'Agente' : 'Cliente'}</Badge>
                          <span>{langFlag(r.source_lang)} → {langFlag(r.target_lang)}</span>
                          {r.latency_ms && <span>· {r.latency_ms}ms</span>}
                          <span className="ml-auto">{format(new Date(r.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                        </div>
                        <p className="italic text-muted-foreground text-xs">{r.original_text}</p>
                        <p className="font-medium">{r.translated_text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Idiomas Suportados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SUPPORTED_LANGS.map((l) => (
                  <div key={l.code} className="rounded border p-3 text-center">
                    <div className="text-3xl">{l.flag}</div>
                    <div className="font-medium mt-1">{l.label}</div>
                    <Badge variant="secondary" className="mt-2 text-xs">{l.code.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hints" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Dicas Culturais por Locale</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-64" /> : (
                <div className="space-y-3">
                  {Array.from(new Set(hints.map((h) => h.locale))).map((loc) => (
                    <div key={loc}>
                      <h3 className="font-semibold mb-2">{loc}</h3>
                      <div className="space-y-1">
                        {hints.filter((h) => h.locale === loc).map((h) => (
                          <div key={h.id} className="flex items-start gap-2 text-sm">
                            <Badge variant={h.severity === 'critical' ? 'destructive' : h.severity === 'warning' ? 'default' : 'secondary'} className="text-[10px] uppercase">{h.context_type}</Badge>
                            <span className="text-muted-foreground">{h.hint_text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-8 w-8 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function topLang(arr: string[]): string {
  if (!arr.length) return 'pt';
  const counts: Record<string, number> = {};
  for (const l of arr) counts[l] = (counts[l] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
