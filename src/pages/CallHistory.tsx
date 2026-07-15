 import { Search, Filter, X, Calendar, Clock, Tag, TrendingUp, TrendingDown, Minus, Download, Phone } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
 import { format } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { useCallHistory, DateRangePreset, SentimentFilter, DurationFilter } from '@/hooks/useCallHistory';
import { CallSessionsList } from '@/components/call-history/CallSessionsList';
import { CallDetailDialog } from '@/components/call-history/CallDetailDialog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDebouncedSearchParam } from '@/hooks/useDebouncedSearchParam';

export default function CallHistory() {
  usePageTitle('Histórico de Chamadas');

   const {
     sessions, isLoading, searchQuery, setSearchQuery,
     selectedSession, setSelectedSession, sessionTranscripts, sessionAnalyses, sessionSummary,
     isLoadingDetails, showFilters, setShowFilters, dateRangePreset, setDateRangePreset,
     customDateFrom, setCustomDateFrom, customDateTo, setCustomDateTo,
     sentimentFilter, setSentimentFilter, durationFilter, setDurationFilter,
     statusFilter, setStatusFilter,
     topicFilter, setTopicFilter, allTopics, activeFiltersCount, clearFilters,
     handleSessionClick, exportTranscript, fetchSessions, loadMore, hasMore,
   } = useCallHistory();

   const {
     inputValue: searchInput,
     debouncedValue: debouncedSearch,
     setValue: setSearchInput,
   } = useDebouncedSearchParam({ paramKey: 'q', delay: 300 });

   useEffect(() => {
     if (debouncedSearch !== searchQuery) setSearchQuery(debouncedSearch);
   }, [debouncedSearch, searchQuery, setSearchQuery]);

 
   const stats = useMemo(() => {
     const s = sessions || [];
     return {
       total: s.length,
       completed: s.filter(c => c.status === 'completed').length,
       missed: s.filter(c => c.status === 'missed' || c.status === 'abandoned').length,
     };
   }, [sessions]);
 
   return (
     <div className="space-y-6 relative">
       <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
       <div className="relative space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">Histórico de Chamadas</h1>
             <p className="text-muted-foreground">Visualize transcrições e análises detalhadas</p>
           </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchSessions(0)}>Atualizar</Button>
              <Button variant="neon" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </div>
         </div>
 
         {/* KPI Cards */}
         <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
           <Card variant="neon-interactive">
             <CardContent className="p-4">
               <p className="text-xs uppercase tracking-wider text-muted-foreground">Total (filtros)</p>
               <p className="text-2xl font-bold">{stats.total}</p>
             </CardContent>
           </Card>
           <Card variant="neon-interactive">
             <CardContent className="p-4">
               <p className="text-xs uppercase tracking-wider text-muted-foreground">Atendidas</p>
               <p className="text-2xl font-bold text-success">{stats.completed}</p>
             </CardContent>
           </Card>
           <Card variant="neon-interactive">
             <CardContent className="p-4">
               <p className="text-xs uppercase tracking-wider text-muted-foreground">Perdidas/Abandonadas</p>
               <p className="text-2xl font-bold text-destructive">{stats.missed}</p>
             </CardContent>
           </Card>
         </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome, telefone ou agente..." className="pl-10" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <Button variant={showFilters ? 'default' : 'outline'} className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" /> Filtros
            {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">{activeFiltersCount}</Badge>}
          </Button>
        </div>

        {showFilters && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> Período</label>
                  <Select value={dateRangePreset} onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar período" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  {dateRangePreset === 'custom' && (
                    <div className="flex gap-2 mt-2">
                      <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">{customDateFrom ? format(customDateFrom, 'dd/MM/yy') : 'De'}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className="pointer-events-auto" /></PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">{customDateTo ? format(customDateTo, 'dd/MM/yy') : 'Até'}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus className="pointer-events-auto" /></PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Sentimento</label>
                  <Select value={sentimentFilter} onValueChange={(v) => setSentimentFilter(v as SentimentFilter)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar sentimento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="positive"><span className="flex items-center gap-2"><TrendingUp className="h-3 w-3 text-success" /> Positivo</span></SelectItem>
                      <SelectItem value="neutral"><span className="flex items-center gap-2"><Minus className="h-3 w-3 text-warning" /> Neutro</span></SelectItem>
                      <SelectItem value="negative"><span className="flex items-center gap-2"><TrendingDown className="h-3 w-3 text-destructive" /> Negativo</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-4 w-4" /> Status</label>
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Todos</SelectItem>
                       <SelectItem value="completed">Atendidas</SelectItem>
                       <SelectItem value="missed">Perdidas</SelectItem>
                       <SelectItem value="abandoned">Abandonadas</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Duração</label>
                  <Select value={durationFilter} onValueChange={(v) => setDurationFilter(v as DurationFilter)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar duração" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="short">Curta (&lt; 1 min)</SelectItem>
                      <SelectItem value="medium">Média (1-5 min)</SelectItem>
                      <SelectItem value="long">Longa (&gt; 5 min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Tag className="h-4 w-4" /> Tópico</label>
                  {allTopics.length > 0 ? (
                    <Select value={topicFilter} onValueChange={setTopicFilter}>
                      <SelectTrigger><SelectValue placeholder="Selecionar tópico" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os tópicos</SelectItem>
                        {allTopics.map(topic => <SelectItem key={topic} value={topic}>{topic}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder="Buscar tópico..." value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} />
                  )}
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <div className="flex justify-end mt-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2"><X className="h-4 w-4" /> Limpar filtros</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <CallSessionsList sessions={sessions} isLoading={isLoading} activeFiltersCount={activeFiltersCount} onSessionClick={handleSessionClick} onClearFilters={clearFilters} onLoadMore={loadMore} hasMore={hasMore} />

       <CallDetailDialog selectedSession={selectedSession} onClose={() => setSelectedSession(null)}
         isLoadingDetails={isLoadingDetails} sessionTranscripts={sessionTranscripts}
         sessionAnalyses={sessionAnalyses} sessionSummary={sessionSummary} onExportTranscript={exportTranscript} />
       </div>
     </div>
   );
 }
