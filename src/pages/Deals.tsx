import { useMemo, useState } from "react";
import { Plus, TrendingUp, Sparkles } from "lucide-react";
import { useDeals, DEAL_STAGES, type Deal } from "@/hooks/useDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePageTitle } from "@/hooks/usePageTitle";
import { NeonPageLayout } from "@/components/layout/NeonPageLayout";
import { safeParseFloat } from "@/lib/safe-number";

function formatCurrency(cents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency })
    .format(cents / 100);
}

function healthClass(score: number | null) {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 75) return "bg-success/20 text-success border-success/40";
  if (score >= 50) return "bg-warning/20 text-warning border-warning/40";
  return "bg-destructive/20 text-destructive border-destructive/40";
}

export default function Deals() {
  usePageTitle("Oportunidades");
  const { deals, loading, createDeal, updateStage, computeHealth } = useDeals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", value: "", stage: "prospecting", probability: "10" });

  const grouped = useMemo(() => {
    const m: Record<string, Deal[]> = {};
    DEAL_STAGES.forEach((s) => (m[s.id] = []));
    deals.forEach((d) => { (m[d.stage] ?? (m[d.stage] = [])).push(d); });
    return m;
  }, [deals]);

  const totals = useMemo(() => {
    const open = deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage));
    return {
      pipeline: open.reduce((s, d) => s + d.value_cents, 0),
      weighted: open.reduce((s, d) => s + (d.value_cents * Number(d.probability)) / 100, 0),
      count: open.length,
    };
  }, [deals]);

  const handleCreate = async () => {
    const value_cents = Math.round(safeParseFloat(form.value, { min: 0, fallback: 0 }) * 100);
    const probability = safeParseFloat(form.probability, { min: 0, max: 100, fallback: 10 });
    const ok = await createDeal({
      name: form.name, value_cents, stage: form.stage,
      probability, status: "open", currency: "BRL",
    });
    if (ok) { setOpen(false); setForm({ name: "", value: "", stage: "prospecting", probability: "10" }); }
  };

  return (
    <NeonPageLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Oportunidades</h1>
          <p className="text-muted-foreground">Pipeline com health score por IA</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova oportunidade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova oportunidade</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Valor (R$)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div>
                <Label>Estágio</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Probabilidade (%)</Label><Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} /></div>
              <Button onClick={handleCreate} disabled={!form.name}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
         <Card variant="neon"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pipeline aberto</p><p className="text-2xl font-bold">{formatCurrency(totals.pipeline)}</p></CardContent></Card>
         <Card variant="neon"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Forecast ponderado</p><p className="text-2xl font-bold">{formatCurrency(totals.weighted)}</p></CardContent></Card>
         <Card variant="neon"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Oportunidades abertas</p><p className="text-2xl font-bold">{totals.count}</p></CardContent></Card>
       </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
         <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 overflow-x-auto">
           {DEAL_STAGES.map((s) => (
             <Card key={s.id} variant="glass-neon" className="min-w-[220px]">
               <CardHeader className="p-3">
                 <CardTitle className="text-sm flex items-center justify-between">
                   <span>{s.label}</span>
                   <Badge variant="outline">{grouped[s.id]?.length ?? 0}</Badge>
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-3 pt-0 space-y-2">
                 {(grouped[s.id] ?? []).map((d) => (
                   <Card key={d.id} variant="neon-interactive" className="p-2">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(d.value_cents, d.currency)}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <Badge className={healthClass(d.health_score)} variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {d.health_score ?? "—"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{d.probability}%</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Select value={d.stage} onValueChange={(v) => updateStage(d.id, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEAL_STAGES.map((st) => <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => computeHealth(d.id)} title="Recalcular health">
                        <Sparkles className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </NeonPageLayout>
  );
}
