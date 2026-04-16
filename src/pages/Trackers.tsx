import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useTrackers } from "@/hooks/useTrackers";
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
import { NeonPageLayout } from "@/components/layout/NeonPageLayout";

const CATEGORIES = ["compliance", "discovery", "closing", "objection", "competitor", "general"];

export default function Trackers() {
  usePageTitle("Trackers");
  const { trackers, loading, createTracker, toggleTracker } = useTrackers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "general", description: "", keywords: "", match_type: "any" as "any" | "all",
  });

  const handleCreate = async () => {
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
  };

  return (
    <NeonPageLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trackers</h1>
          <p className="text-muted-foreground">Rastreadores customizáveis de palavras e temas</p>
        </div>
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
              <Button onClick={handleCreate} disabled={!form.name || !form.keywords}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </NeonPageLayout>
  );
}
