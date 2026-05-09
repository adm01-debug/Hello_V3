 import { Sparkles, Calendar, Clock, Brain, Loader2, TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, Heart, Zap, AlertTriangle, Search, ChevronUp, ChevronDown } from 'lucide-react';
 import { formatDuration } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
 import { TranscriptionSegment, SentimentAnalysis, Recording } from '@/hooks/useRecordings';
 import { useState, useMemo, useEffect } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcription: { text: string; segments: TranscriptionSegment[]; recording: Recording | null; sentiment?: SentimentAnalysis | null } | null;
  onAnalyzeSentiment: () => void;
  analyzingSentiment: boolean;
}

 export function TranscriptionDialog({ open, onOpenChange, transcription, onAnalyzeSentiment, analyzingSentiment }: Props) {
   const [searchQuery, setSearchQuery] = useState('');
   const [currentIndex, setCurrentIndex] = useState(0);
 
   const matches = useMemo(() => {
     if (!searchQuery || !transcription) return [];
     return transcription.segments.reduce((acc: number[], segment, idx) => {
       if (segment.text.toLowerCase().includes(searchQuery.toLowerCase())) {
         acc.push(idx);
       }
       return acc;
     }, []);
   }, [searchQuery, transcription]);
 
   useEffect(() => {
     setCurrentIndex(0);
   }, [searchQuery]);
 
   const jumpToMatch = (index: number) => {
     if (matches.length === 0) return;
     const segmentIdx = matches[index];
     const element = document.getElementById(`segment-${segmentIdx}`);
     if (element) {
       element.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }
   };
 
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (!searchQuery || matches.length === 0) return;
       if (e.key === 'Enter') {
         e.preventDefault();
         const newIdx = e.shiftKey 
           ? (currentIndex - 1 + matches.length) % matches.length
           : (currentIndex + 1) % matches.length;
         setCurrentIndex(newIdx);
         jumpToMatch(newIdx);
       }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [searchQuery, matches, currentIndex]);
 
   if (!transcription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Transcrição e Análise de Sentimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {transcription.recording && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(transcription.recording.recorded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                {transcription.recording.duration_seconds && <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(transcription.recording.duration_seconds)}</div>}
              </div>
              {!transcription.sentiment && (
                <Button onClick={onAnalyzeSentiment} disabled={analyzingSentiment} variant="outline" size="sm">
                  {analyzingSentiment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />} Analisar Sentimento
                </Button>
              )}
            </div>
          )}
          <Tabs defaultValue="transcription" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transcription">Transcrição</TabsTrigger>
              <TabsTrigger value="sentiment" disabled={!transcription.sentiment}>
                Análise de Sentimento
                {transcription.sentiment && (
                  <Badge variant={transcription.sentiment.overall_sentiment === 'positive' ? 'default' : transcription.sentiment.overall_sentiment === 'negative' ? 'destructive' : 'secondary'} className="ml-2 text-xs">
                    {transcription.sentiment.overall_sentiment === 'positive' && <Smile className="h-3 w-3 mr-1" />}
                    {transcription.sentiment.overall_sentiment === 'negative' && <Frown className="h-3 w-3 mr-1" />}
                    {(transcription.sentiment.overall_sentiment === 'neutral' || transcription.sentiment.overall_sentiment === 'mixed') && <Meh className="h-3 w-3 mr-1" />}
                    {transcription.sentiment.overall_sentiment}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
             <TabsContent value="transcription" className="mt-4 space-y-4">
               <div className="flex gap-2 items-center">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input 
                     placeholder="Pesquisar na transcrição (Enter para pular)..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10"
                   />
                 </div>
                 {matches.length > 0 && (
                   <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
                     <span>{currentIndex + 1} / {matches.length}</span>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const i = (currentIndex - 1 + matches.length) % matches.length; setCurrentIndex(i); jumpToMatch(i); }}>
                       <ChevronUp className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const i = (currentIndex + 1) % matches.length; setCurrentIndex(i); jumpToMatch(i); }}>
                       <ChevronDown className="h-4 w-4" />
                     </Button>
                   </div>
                 )}
               </div>
               <ScrollArea className="h-[350px] rounded-md border p-4">
                 {transcription.segments.length > 0 ? (
                   <div className="space-y-4">
                     {transcription.segments.map((segment, index) => (
                       <div key={index} id={`segment-${index}`} className={`space-y-1 p-2 rounded-lg transition-colors ${matches[currentIndex] === index && searchQuery ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
                         <div className="flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                             <Badge variant="secondary" className="text-xs">{segment.speaker}</Badge>
                             {segment.start_time !== null && (
                               <span className="text-[10px] font-mono bg-muted px-1 rounded text-muted-foreground">
                                 [{formatDuration(segment.start_time)}]
                               </span>
                             )}
                           </div>
                           {matches.includes(index) && searchQuery && <span className="text-[10px] text-primary font-bold">OCORRÊNCIA</span>}
                         </div>
                         <p className="text-sm text-foreground pl-2 border-l-2 border-primary/30">
                           {searchQuery ? (
                             segment.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                               part.toLowerCase() === searchQuery.toLowerCase() 
                                 ? <span key={i} className="bg-primary/20 text-primary font-medium">{part}</span>
                                 : part
                             ))
                           ) : segment.text}
                         </p>
                       </div>
                     ))}
                   </div>
                 ) : <p className="text-foreground whitespace-pre-wrap">{transcription.text}</p>}
               </ScrollArea>
             </TabsContent>
            <TabsContent value="sentiment" className="mt-4">
              {transcription.sentiment && (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-6 pr-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Resumo</h4>
                      <p className="text-sm text-muted-foreground">{transcription.sentiment.summary}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Score de Sentimento</span>
                          {transcription.sentiment.sentiment_score > 0 ? <TrendingUp className="h-4 w-4 text-success" /> : transcription.sentiment.sentiment_score < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="text-2xl font-bold">{(transcription.sentiment.sentiment_score * 100).toFixed(0)}%</div>
                        <Progress value={(transcription.sentiment.sentiment_score + 1) * 50} className="h-2 mt-2" />
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Satisfação Estimada</span><Heart className="h-4 w-4 text-destructive" /></div>
                        <div className="text-2xl font-bold">{transcription.sentiment.customer_satisfaction_estimate}/10</div>
                        <Progress value={transcription.sentiment.customer_satisfaction_estimate * 10} className="h-2 mt-2" />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-medium mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /> Emoções Detectadas</h4>
                      <div className="space-y-3">
                        {[{ key: 'joy', label: 'Alegria', icon: '😊' }, { key: 'sadness', label: 'Tristeza', icon: '😢' }, { key: 'anger', label: 'Raiva', icon: '😠' }, { key: 'fear', label: 'Medo', icon: '😨' }, { key: 'surprise', label: 'Surpresa', icon: '😮' }].map(({ key, label, icon }) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-lg">{icon}</span><span className="text-sm w-20">{label}</span>
                            <div className="flex-1"><Progress value={(transcription.sentiment?.emotions[key as keyof typeof transcription.sentiment.emotions] || 0) * 100} className="h-2" /></div>
                            <span className="text-sm text-muted-foreground w-12 text-right">{((transcription.sentiment?.emotions[key as keyof typeof transcription.sentiment.emotions] || 0) * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {transcription.sentiment.key_moments.length > 0 && (
                      <div className="p-4 rounded-lg border">
                        <h4 className="font-medium mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-call-hold" /> Momentos-Chave</h4>
                        <div className="space-y-3">
                          {transcription.sentiment.key_moments.map((moment, index) => (
                            <div key={index} className="p-3 rounded bg-muted/50">
                              <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-xs">{moment.sentiment}</Badge><Badge variant="secondary" className="text-xs">{moment.emotion}</Badge></div>
                              <p className="text-sm text-muted-foreground italic">"{moment.text}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(transcription.text); toast.success('Transcrição copiada!'); }}>Copiar Texto</Button>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
