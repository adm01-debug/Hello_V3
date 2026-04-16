import { useState } from "react";
import { Plus, Phone, MessageSquare, CheckSquare, Mail } from "lucide-react";
import { useCadences, type CadenceStep } from "@/hooks/useCadences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePageTitle } from "@/hooks/usePageTitle";
import { NeonPageLayout } from "@/components/layout/NeonPageLayout";

const STEP_ICONS: Record<string, typeof Phone> = {
  call: Phone, whatsapp: MessageSquare, task: CheckSquare, email: Mail,
};

export default function Cadences() {
  usePageTitle("Cadências");
  const { cadences, steps, loading, createCadence, addStep } = useCadences();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stepOpen, setStepOpen] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState<Partial<CadenceStep>>({
    step_type: "call", delay_days: 1, delay_hours: 0, subject: "", body: "",
  });

  const handleCreate = async () => {
    const c = await createCadence(name, description);
    if (c) { setName(""); setDescription(""); setOpen(false); }
  };

  const handleAddStep = async (cadenceId: string) => {
    const order = (steps.filter((s) => s.cadence_id === cadenceId).length) + 1;
    await addStep({
      cadence_id: cadenceId,
      step_order: order,
      step_type: (stepForm.step_type ?? "call") as CadenceStep["step_type"],
      delay_days: stepForm.delay_days ?? 1,
      delay_hours: stepForm.delay_hours ?? 0,
      subject: stepForm.subject ?? null,
      body: stepForm.body ?? null,
      metadata: null as never,
    } as never);
    setStepOpen(null);
    setStepForm({ step_type: "call", delay_days: 1, delay_hours: 0, subject: "", body: "" });
  };

  return (
    <NeonPageLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadências</h1>
          <p className="text-muted-foreground">Sequências multi-touch automáticas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova cadência</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova cadência</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <Button onClick={handleCreate} disabled={!name}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : cadences.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma cadência criada.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cadences.map((c) => {
            const cSteps = steps.filter((s) => s.cadence_id === c.id);
            return (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{c.name}</span>
                    <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Ativa" : "Inativa"}</Badge>
                  </CardTitle>
                  {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                </CardHeader>
                <CardContent className="space-y-2">
                  {cSteps.map((s) => {
                    const Icon = STEP_ICONS[s.step_type] ?? Phone;
                    return (
                      <div key={s.id} className="flex items-center gap-2 p-2 border rounded">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1">Passo {s.step_order} — {s.step_type}</span>
                        <Badge variant="outline">+{s.delay_days}d {s.delay_hours}h</Badge>
                      </div>
                    );
                  })}
                  <Dialog open={stepOpen === c.id} onOpenChange={(o) => setStepOpen(o ? c.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full"><Plus className="h-3 w-3 mr-1" />Adicionar passo</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar passo</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Tipo</Label>
                          <Select value={stepForm.step_type} onValueChange={(v) => setStepForm({ ...stepForm, step_type: v as CadenceStep["step_type"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Ligação</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="task">Tarefa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label>Dias</Label><Input type="number" value={stepForm.delay_days} onChange={(e) => setStepForm({ ...stepForm, delay_days: +e.target.value })} /></div>
                          <div><Label>Horas</Label><Input type="number" value={stepForm.delay_hours} onChange={(e) => setStepForm({ ...stepForm, delay_hours: +e.target.value })} /></div>
                        </div>
                        <div><Label>Assunto</Label><Input value={stepForm.subject ?? ""} onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })} /></div>
                        <div><Label>Conteúdo</Label><Textarea value={stepForm.body ?? ""} onChange={(e) => setStepForm({ ...stepForm, body: e.target.value })} /></div>
                        <Button onClick={() => handleAddStep(c.id)}>Adicionar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </NeonPageLayout>
  );
}
