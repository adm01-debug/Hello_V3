import { useState } from 'react';
import { useShifts, AgentShift } from '@/hooks/useShifts';
import { useTimeOff } from '@/hooks/useTimeOff';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar, CalendarDays, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getWeekStart(d = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return date.toISOString().split('T')[0];
}

export default function Scheduling() {
  usePageTitle('Escala & Turnos');
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ agent_name: '', shift_date: '', start_time: '09:00', end_time: '18:00', break_minutes: 60 });
  const { shifts, templates, isLoading, createShift, deleteShift } = useShifts(weekStart);
  const { requests, create: createTimeOff, review } = useTimeOff();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    return d;
  });

  const handleCreate = () => {
    if (!form.agent_name || !form.shift_date) return;
    const start = new Date(`${form.shift_date}T${form.start_time}:00`).toISOString();
    const end = new Date(`${form.shift_date}T${form.end_time}:00`).toISOString();
    createShift({
      agent_name: form.agent_name,
      shift_date: form.shift_date,
      start_time: start,
      end_time: end,
      break_minutes: form.break_minutes,
      template_id: null,
      status: 'scheduled',
      notes: null,
      created_by: null as any,
    } as Omit<AgentShift, 'id' | 'created_at' | 'updated_at'>);
    setOpen(false);
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader title="Escala & Turnos" description="Planejamento semanal de força de trabalho" icon={<CalendarDays className="h-5 w-5" />} />

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid"><Calendar className="h-4 w-4 mr-1" /> Grade Semanal</TabsTrigger>
          <TabsTrigger value="timeoff">Solicitações de Folga ({requests.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="templates">Modelos ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d.toISOString().split('T')[0]);
              }}>← Semana anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getWeekStart())}>Esta semana</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d.toISOString().split('T')[0]);
              }}>Próxima semana →</Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Turno</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Turno</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Agente</Label><Input value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} /></div>
                  <div><Label>Data</Label><Input type="date" value={form.shift_date} onChange={e => setForm({ ...form, shift_date: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Início</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
                    <div><Label>Fim</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
                  </div>
                  <div><Label>Intervalo (min)</Label><Input type="number" value={form.break_minutes} onChange={e => setForm({ ...form, break_minutes: Number(e.target.value) })} /></div>
                </div>
                <DialogFooter><Button onClick={handleCreate}>Criar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <div className="grid grid-cols-7 min-w-[800px]">
                {days.map((d, i) => (
                  <div key={i} className="border-r border-border last:border-r-0">
                    <div className="p-2 text-center border-b border-border bg-accent/30">
                      <div className="text-xs text-muted-foreground">{DAYS_PT[d.getDay()]}</div>
                      <div className="font-semibold">{d.getDate()}/{d.getMonth() + 1}</div>
                    </div>
                    <div className="p-2 space-y-1 min-h-[200px]">
                      {isLoading ? <div className="text-xs text-muted-foreground">...</div> : shifts
                        .filter(s => s.shift_date === d.toISOString().split('T')[0])
                        .map(s => (
                          <div key={s.id} className="p-2 rounded border border-primary/30 bg-primary/5 text-xs space-y-1">
                            <div className="font-medium">{s.agent_name}</div>
                            <div className="text-muted-foreground">
                              {new Date(s.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-full text-destructive" onClick={() => deleteShift(s.id)}>Remover</Button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeoff" className="space-y-3 mt-4">
          {requests.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma solicitação</CardContent></Card>
          ) : requests.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.agent_name}</div>
                  <div className="text-sm text-muted-foreground">{r.start_date} → {r.end_date} • {r.request_type}</div>
                  {r.reason && <div className="text-sm mt-1">{r.reason}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => review({ id: r.id, status: 'approved' })}><CheckCircle2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => review({ id: r.id, status: 'rejected' })}><XCircle className="h-4 w-4" /></Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="space-y-3 mt-4">
          {templates.map(t => (
            <Card key={t.id}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t.name}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t.start_time} - {t.end_time} • Intervalo {t.break_minutes}min • Dias: {t.days_of_week.map(d => DAYS_PT[d]).join(', ')}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </NeonPageLayout>
  );
}
