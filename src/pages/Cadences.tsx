import { useState } from "react";
import { Plus, Phone, MessageSquare, CheckSquare, Mail, Pencil, Trash2, Power } from "lucide-react";
import { useCadences, type Cadence, type CadenceStep } from "@/hooks/useCadences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { NeonPageLayout } from "@/components/layout/NeonPageLayout";

const STEP_ICONS: Record<string, typeof Phone> = {
  call: Phone, whatsapp: MessageSquare, task: CheckSquare, email: Mail,
};

export default function Cadences() {
  usePageTitle("Cadências");
  const {
    cadences, steps, loading, totalCount, hasMore, loadingMore, loadMore,
    createCadence, addStep, updateCadence, deleteCadence, updateStep, deleteStep,
  } = useCadences();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stepOpen, setStepOpen] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState<Partial<CadenceStep>>({
    step_type: "call", delay_days: 1, delay_hours: 0, subject: "", body: "",
  });
    const [submitting, setSubmitting] = useState(false);
  const [editingCadence, setEditingCadence] = useState<Cadence | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingStep, setEditingStep] = useState<CadenceStep | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { kind: "cadence" | "step"; id: string; label: string } | null
  >(null);

  const handleCreate = async () => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const c = await createCadence(name, description);
        if (c) { setName(""); setDescription(""); setOpen(false); }
      } finally { setSubmitting(false); }
  };

  const handleAddStep = async (cadenceId: string) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const order = Math.max(0, ...steps.filter((s) => s.cadence_id === cadenceId).map((s) => s.step_order)) + 1;
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
      } finally { setSubmitting(false); }
  };

  const openEditCadence = (c: Cadence) => {
    setEditingCadence(c);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
  };

  const handleSaveCadence = async () => {
    if (!editingCadence || submitting) return;
    setSubmitting(true);
    try {
      const ok = await updateCadence(editingCadence.id, {
        name: editName,
        description: editDescription || null,
      });
      if (ok) setEditingCadence(null);
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (c: Cadence) => {
    if (submitting) return;
    setSubmitting(true);
    try { await updateCadence(c.id, { is_active: !c.is_active }); }
    finally { setSubmitting(false); }
  };

  const openEditStep = (s: CadenceStep) => {
    setEditingStep(s);
    setStepForm({
      step_type: s.step_type,
      delay_days: s.delay_days,
      delay_hours: s.delay_hours,
      subject: s.subject ?? "",
      body: s.body ?? "",
    });
  };

  const handleSaveStep = async () => {
    if (!editingStep || submitting) return;
    setSubmitting(true);
    try {
      const ok = await updateStep(editingStep.id, {
        step_type: (stepForm.step_type ?? "call") as CadenceStep["step_type"],
        delay_days: stepForm.delay_days ?? 0,
        delay_hours: stepForm.delay_hours ?? 0,
        subject: stepForm.subject ?? null,
        body: stepForm.body ?? null,
      });
      if (ok) setEditingStep(null);
    } finally { setSubmitting(false); }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || submitting) return;
    setSubmitting(true);
    try {
      if (pendingDelete.kind === "cadence") await deleteCadence(pendingDelete.id);
      else await deleteStep(pendingDelete.id);
      setPendingDelete(null);
    } finally { setSubmitting(false); }
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
              <Button onClick={handleCreate} disabled={!name || submitting}>Criar</Button>
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
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{c.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Ativa" : "Inativa"}</Badge>
                      <Button variant="ghost" size="icon" aria-label={`Editar cadência ${c.name}`} onClick={() => openEditCadence(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={c.is_active ? `Desativar cadência ${c.name}` : `Ativar cadência ${c.name}`}
                        onClick={() => handleToggleActive(c)}
                      >
                        <Power className={c.is_active ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir cadência ${c.name}`}
                        onClick={() => setPendingDelete({ kind: "cadence", id: c.id, label: c.name })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
                        <Button variant="ghost" size="icon" aria-label={`Editar passo ${s.step_order}`} onClick={() => openEditStep(s)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir passo ${s.step_order}`}
                          onClick={() => setPendingDelete({ kind: "step", id: s.id, label: `Passo ${s.step_order} — ${s.step_type}` })}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
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
                        <Button onClick={() => handleAddStep(c.id)} disabled={submitting}>Adicionar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Carregando..." : "Carregar mais cadências"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            {cadences.length} de {totalCount ?? cadences.length} cadências carregadas.
          </p>
        </div>
      )}

      <Dialog open={!!editingCadence} onOpenChange={(o) => { if (!o) setEditingCadence(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cadência</DialogTitle></DialogHeader>
          <DialogDescription>Ajuste o nome e a descrição desta cadência.</DialogDescription>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div><Label>Descrição</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /></div>
            <Button onClick={handleSaveCadence} disabled={!editName || submitting}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingStep} onOpenChange={(o) => { if (!o) setEditingStep(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar passo</DialogTitle></DialogHeader>
          <DialogDescription>Altere o tipo, o atraso e o conteúdo deste passo.</DialogDescription>
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
            <Button onClick={handleSaveStep} disabled={submitting}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {pendingDelete?.kind === "cadence" ? "cadência" : "passo"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "cadence"
                ? `"${pendingDelete.label}" será removida junto com seus passos e inscrições de contatos. Esta ação não pode ser desfeita.`
                : `"${pendingDelete?.label}" será removido da cadência. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NeonPageLayout>
  );
}
