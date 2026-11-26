import { useMemo, useState } from "react";
import { Plus, Phone, MessageSquare, CheckSquare, Mail, Pencil, Trash2, Power, UserPlus, Play, Pause, X } from "lucide-react";
import { useCadences, useCadenceEnrollments, type Cadence, type CadenceStep, type CadenceEnrollment } from "@/hooks/useCadences";
import { useContacts } from "@/hooks/useContacts";
import { useAgentStatus } from "@/hooks/useAgentStatus";
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

const ENROLLMENT_LABEL: Record<CadenceEnrollment["status"], string> = {
  active: "Ativa", paused: "Pausada", completed: "Concluída", cancelled: "Cancelada",
};

export default function Cadences() {
  usePageTitle("Cadências");
  const {
    cadences, steps, loading, totalCount, hasMore, loadingMore, loadMore,
    createCadence, addStep, updateCadence, deleteCadence, updateStep, deleteStep, enrollContact,
  } = useCadences();
  const { currentAgent } = useAgentStatus();
  const { contacts } = useContacts();
  const { enrollments, refresh: refreshEnrollments, updateEnrollmentStatus } = useCadenceEnrollments();
  const [enrollFor, setEnrollFor] = useState<Cadence | null>(null);
  const [contactSearch, setContactSearch] = useState("");
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

  const handleEnroll = async (contactId: string) => {
    if (!enrollFor || submitting) return;
    setSubmitting(true);
    try {
      const ok = await enrollContact(enrollFor.id, contactId, currentAgent?.name);
      if (ok) { refreshEnrollments(); setEnrollFor(null); setContactSearch(""); }
    } finally { setSubmitting(false); }
  };

  const handleEnrollmentStatus = async (id: string, status: CadenceEnrollment["status"]) => {
    if (submitting) return;
    setSubmitting(true);
    try { await updateEnrollmentStatus(id, status); }
    finally { setSubmitting(false); }
  };

  const contactNameById = useMemo(
    () => new Map(contacts.map((c) => [c.id, c.name])),
    [contacts],
  );
  const catalogContacts = useMemo(() => {
    const enrolled = new Set(
      enrollments
        .filter((e) => e.cadence_id === enrollFor?.id && (e.status === "active" || e.status === "paused"))
        .map((e) => e.contact_id),
    );
    const term = contactSearch.trim().toLowerCase();
    return (term
      ? contacts.filter((c) =>
          c.name?.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term))
      : contacts
    ).map((c) => ({ contact: c, alreadyEnrolled: enrolled.has(c.id) }));
  }, [contacts, contactSearch, enrollments, enrollFor]);
  const enrollableContacts = catalogContacts.slice(0, 50);

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
            const cEnroll = enrollments.filter((e) => e.cadence_id === c.id);
            return (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{c.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Ativa" : "Inativa"}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Inscrever contato na cadência ${c.name}`}
                        onClick={() => { setEnrollFor(c); setContactSearch(""); }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
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
                  {cEnroll.length > 0 && (
                    <div className="mt-4 space-y-1 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground">Inscritos ({cEnroll.length})</p>
                      {cEnroll.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate">
                            {e.contact_id ? contactNameById.get(e.contact_id) ?? "Contato" : "Sem contato"}
                            {e.status === "paused" && e.paused_reason && (
                              <span className="block truncate text-xs text-muted-foreground" title={e.paused_reason}>
                                Pausada: {e.paused_reason}
                              </span>
                            )}
                            {e.status === "active" && e.next_action_at && (
                              <span className="block text-xs text-muted-foreground">
                                Proximo passo: {new Date(e.next_action_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant={e.status === "active" ? "default" : "secondary"}>
                              {ENROLLMENT_LABEL[e.status]}
                            </Badge>
                            {e.status === "active" && (
                              <Button variant="ghost" size="icon" aria-label="Pausar inscrição" onClick={() => handleEnrollmentStatus(e.id, "paused")}>
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {e.status === "paused" && (
                              <Button variant="ghost" size="icon" aria-label="Retomar inscrição" onClick={() => handleEnrollmentStatus(e.id, "active")}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {(e.status === "active" || e.status === "paused") && (
                              <Button variant="ghost" size="icon" aria-label="Cancelar inscrição" onClick={() => handleEnrollmentStatus(e.id, "cancelled")}>
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

      <Dialog open={!!enrollFor} onOpenChange={(o) => { if (!o) { setEnrollFor(null); setContactSearch(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Inscrever contato</DialogTitle></DialogHeader>
          <DialogDescription>
            Escolha um contato para iniciar a cadência {enrollFor?.name ?? ""}.
          </DialogDescription>
          <div className="space-y-3">
            <Input
              placeholder="Buscar por nome ou telefone"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {enrollableContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum contato encontrado.</p>
              ) : enrollableContacts.map(({ contact: ct, alreadyEnrolled }) => (
                <button
                  key={ct.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
                  onClick={() => handleEnroll(ct.id)}
                  disabled={submitting || alreadyEnrolled}
                >
                  <span className="truncate">{ct.name || ct.phone || ct.email || "Sem nome"}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {alreadyEnrolled ? "Já inscrito" : ct.phone}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
