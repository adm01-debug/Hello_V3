import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useScorecards, type CallScorecard } from "@/hooks/useScorecards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Sparkles, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUS_LABEL: Record<CallScorecard["status"], string> = {
  draft: "Rascunho",
  submitted: "Enviada",
  approved: "Aprovada",
};

const STATUS_VARIANT: Record<CallScorecard["status"], "secondary" | "default" | "outline"> = {
  draft: "outline",
  submitted: "secondary",
  approved: "default",
};

export default function Scorecards() {
  usePageTitle("Avaliações de Chamada");
  const { templates, updateStatus, createTemplate, generateAIScorecard } = useScorecards();
  const [templateId, setTemplateId] = useState("");
  const [callId, setCallId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCriteria, setNewCriteria] = useState([
    { label: "Abertura e identificação", description: "", weight: 1, max_score: 5 },
    { label: "Clareza e objetividade", description: "", weight: 1, max_score: 5 },
    { label: "Resolução do problema", description: "", weight: 2, max_score: 5 },
  ]);

  const submitTemplate = async () => {
    setCreating(true);
    try {
      const id = await createTemplate(
        newName,
        newDesc || null,
        newCriteria
          .filter((c) => c.label.trim())
          .map((c) => ({ label: c.label, description: c.description || null, weight: c.weight, max_score: c.max_score })),
      );
      if (id) { setNewName(""); setNewDesc(""); setTemplateId(id); }
    } finally {
      setCreating(false);
    }
  };

  const { data: scorecards, refetch: refetchScorecards } = useQuery({
    queryKey: ["scorecard-list", templateId, callId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_scorecards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as CallScorecard[];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["scorecard-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_sessions")
        .select("id, agent_name, started_at")
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const generate = async () => {
    if (!callId || !templateId) return;
    setGenerating(true);
    try {
      await generateAIScorecard(templateId, callId);
      setCallId("");
      await refetchScorecards();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Avaliações de Chamada</h1>
          <p className="text-sm text-muted-foreground">
            Avaliação por rubrica com preenchimento automático pela IA.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> Gerar avaliação com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhum modelo ativo. Crie o primeiro abaixo — os critérios já vêm pré-preenchidos e podem ser editados.
              </p>
              <Input placeholder="Nome do modelo (ex.: Avaliação de Atendimento)" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Descrição (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <div className="space-y-2">
                {newCriteria.map((c, i) => (
                  <div key={i} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                    <Input
                      placeholder="Critério"
                      value={c.label}
                      onChange={(e) => setNewCriteria((p) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                    />
                    <Input
                      type="number" step="0.5" min="0.5" placeholder="Peso" value={c.weight}
                      onChange={(e) => setNewCriteria((p) => p.map((x, j) => j === i ? { ...x, weight: Number(e.target.value) } : x))}
                    />
                    <Input
                      type="number" step="1" min="1" placeholder="Nota máx." value={c.max_score}
                      onChange={(e) => setNewCriteria((p) => p.map((x, j) => j === i ? { ...x, max_score: Number(e.target.value) } : x))}
                    />
                    <Button variant="ghost" size="sm" onClick={() => setNewCriteria((p) => p.filter((_, j) => j !== i))}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setNewCriteria((p) => [...p, { label: "", description: "", weight: 1, max_score: 5 }])}>
                  Adicionar critério
                </Button>
                <Button onClick={submitTemplate} disabled={creating || !newName.trim()}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar modelo
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Modelo de avaliação" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={callId} onValueChange={setCallId}>
                <SelectTrigger><SelectValue placeholder="Chamada concluída" /></SelectTrigger>
                <SelectContent>
                  {(sessions ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.agent_name ?? "—"} · {new Date(s.started_at).toLocaleString("pt-BR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={generate} disabled={!callId || !templateId || generating}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Gerar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avaliações registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {!scorecards ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : scorecards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecards.map((s) => {
                  const pct = s.max_total ? Math.round((Number(s.total_score ?? 0) / Number(s.max_total)) * 100) : null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.agent_name ?? "—"}</TableCell>
                      <TableCell>
                        {s.total_score != null ? `${Number(s.total_score).toFixed(1)} / ${Number(s.max_total ?? 0).toFixed(0)}` : "—"}
                        {pct != null && <span className="ml-2 text-xs text-muted-foreground">({pct}%)</span>}
                      </TableCell>
                      <TableCell>
                        {s.ai_generated ? <Badge variant="secondary">IA</Badge> : <Badge variant="outline">Manual</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={async () => { await updateStatus(s.id, "submitted"); await refetchScorecards(); }}>
                            Enviar
                          </Button>
                        )}
                        {s.status === "submitted" && (
                          <Button size="sm" onClick={async () => { await updateStatus(s.id, "approved"); await refetchScorecards(); }}>
                            Aprovar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
