import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Tag } from "lucide-react";
import { useTrackerMatches, useTrackers } from "@/hooks/useTrackers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLockedWrite } from "@/hooks/useLockedWrite";
import { NeonPageLayout } from "@/components/layout/NeonPageLayout";
import { safeFormatDatePtBR } from "@/lib/safe-date";

const CATEGORIES = ["compliance", "discovery", "closing", "objection", "competitor", "general"];

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

function TrackerMatches({ trackerId, days }: { trackerId: string; days: number }) {
  const { matches, loading } = useTrackerMatches({ trackerId, days });

  if (loading) return <p className="text-xs text-muted-foreground mt-3">Carregando acertos...</p>;

  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs font-medium mb-2">Acertos no período ({matches.length})</p>
      {matches.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma chamada transcrita no período. O acerto aparece depois que a chamada é transcrita e analisada.
        </p>
      ) : (
        <ul className="space-y-2">
          {matches.slice(0, 5).map((m) => (
            <li key={m.id} className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{m.agent_name ?? "Agente não identificado"}</span>
                <span className="text-muted-foreground shrink-0">{safeFormatDatePtBR(m.created_at, "dd/MM HH:mm")}</span>
              </div>
              {m.matched_keyword && <Badge variant="outline" className="text-[10px] my-1">{m.matched_keyword}</Badge>}
              <p className="text-muted-foreground line-clamp-2">{m.quote}</p>
              <Link to={`/history?session=${m.call_session_id}`} className="text-primary hover:underline">
                Abrir chamada
              </Link>
            </li>
          ))}
          {matches.length > 5 && (
            <li className="text-muted-foreground">
              Mostrando os 5 mais recentes de {matches.length}
              {matches.length >= 500 ? "+" : ""} no período.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function Trackers() {
  usePageTitle("Trackers");
  const { trackers, loading, createTracker, toggleTracker } = useTrackers();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [form, setForm] = useState({
    name: "", category: "general", description: "", keywords: "", match_type: "any" as "any" | "all",
  });
  const { runLocked, isLocked } = useLockedWrite();

  const handleCreate = () =>
    runLocked("novo-tracker", async () => {
      const ok = await createTracker({
        name: form.name,
        category: form.category,
        description: form.description || null,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        match_type: form.match_type,
        is_active: true,
        color: "primary",
      });
      if (ok) { setOpen(false); setForm({ name: "", category: "general", description: "", keywords: "", match_type: "any" }); }
    });

  return (
    <NeonPageLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trackers</h1>
          <p className="text-muted-foreground">Rastreadores customizáveis de palavras e temas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo tracker</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo tracker</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Palavras-chave (separadas por vírgula)</Label><Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></div>
              <div>
                <Label>Tipo de match</Label>
                <Select value={form.match_type} onValueChange={(v) => setForm({ ...form, match_type: v as "any" | "all" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="any">Qualquer palavra</SelectItem><SelectItem value="all">Todas as palavras</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={isLocked("novo-tracker") || !form.name || !form.keywords}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : trackers.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum tracker criado.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trackers.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />{t.name}</span>
                  <Switch checked={t.is_active} onCheckedChange={(v) => toggleTracker(t.id, v)} />
                </CardTitle>
                <Badge variant="outline" className="w-fit">{t.category}</Badge>
              </CardHeader>
              <CardContent>
                {t.description && <p className="text-sm text-muted-foreground mb-2">{t.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {t.keywords.map((k) => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Match: {t.match_type === "any" ? "qualquer" : "todas"}</p>
                <TrackerMatches trackerId={t.id} days={days} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </NeonPageLayout>
  );
}
