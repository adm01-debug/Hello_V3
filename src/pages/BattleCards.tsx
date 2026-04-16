import { useEffect, useState } from 'react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Swords, Plus, Trash2, Edit, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';

interface BattleCard {
  id: string;
  competitor_name: string;
  description: string | null;
  our_strengths: string[];
  their_weaknesses: string[];
  talking_points: string[];
  is_active: boolean;
}

interface Trigger { id: string; battle_card_id: string; keyword: string; }

const empty = {
  competitor_name: '',
  description: '',
  our_strengths: '',
  their_weaknesses: '',
  talking_points: '',
  keywords: '',
};

export default function BattleCards() {
  usePageTitle('Battle Cards');
  const [cards, setCards] = useState<BattleCard[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: c }, { data: t }] = await Promise.all([
      (supabase.from('battle_cards') as any).select('*').order('competitor_name'),
      (supabase.from('battle_card_triggers') as any).select('*'),
    ]);
    setCards((c || []) as BattleCard[]);
    setTriggers((t || []) as Trigger[]);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.competitor_name.trim()) { toast.error('Nome do concorrente é obrigatório'); return; }
    const payload = {
      competitor_name: form.competitor_name.trim(),
      description: form.description || null,
      our_strengths: form.our_strengths.split('\n').map(s => s.trim()).filter(Boolean),
      their_weaknesses: form.their_weaknesses.split('\n').map(s => s.trim()).filter(Boolean),
      talking_points: form.talking_points.split('\n').map(s => s.trim()).filter(Boolean),
      is_active: true,
    };

    let cardId = editingId;
    if (editingId) {
      const { error } = await (supabase.from('battle_cards') as any).update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await (supabase.from('battle_cards') as any).insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      cardId = data.id;
    }

    // sync triggers (replace strategy)
    if (cardId) {
      await (supabase.from('battle_card_triggers') as any).delete().eq('battle_card_id', cardId);
      const kws = form.keywords.split(',').map(k => k.trim()).filter(Boolean);
      if (kws.length > 0) {
        await (supabase.from('battle_card_triggers') as any).insert(
          kws.map(keyword => ({ battle_card_id: cardId, keyword, match_type: 'contains', is_active: true }))
        );
      }
    }

    toast.success(editingId ? 'Battle card atualizado' : 'Battle card criado');
    setOpen(false); setForm(empty); setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este battle card?')) return;
    const { error } = await (supabase.from('battle_cards') as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Battle card excluído');
    load();
  };

  const startEdit = (c: BattleCard) => {
    const cardTriggers = triggers.filter(t => t.battle_card_id === c.id).map(t => t.keyword).join(', ');
    setForm({
      competitor_name: c.competitor_name,
      description: c.description || '',
      our_strengths: c.our_strengths.join('\n'),
      their_weaknesses: c.their_weaknesses.join('\n'),
      talking_points: c.talking_points.join('\n'),
      keywords: cardTriggers,
    });
    setEditingId(c.id);
    setOpen(true);
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        icon={Swords}
        title="Battle Cards"
        description="Cartões competitivos disparados em tempo real durante a chamada"
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(empty); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Battle Card</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar' : 'Novo'} Battle Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome do concorrente" value={form.competitor_name} onChange={(e) => setForm({ ...form, competitor_name: e.target.value })} />
                <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                <Textarea placeholder="Nossas vantagens (uma por linha)" value={form.our_strengths} onChange={(e) => setForm({ ...form, our_strengths: e.target.value })} rows={3} />
                <Textarea placeholder="Fraquezas deles (uma por linha)" value={form.their_weaknesses} onChange={(e) => setForm({ ...form, their_weaknesses: e.target.value })} rows={3} />
                <Textarea placeholder="Pontos a destacar (um por linha)" value={form.talking_points} onChange={(e) => setForm({ ...form, talking_points: e.target.value })} rows={3} />
                <Input placeholder="Palavras-gatilho (separadas por vírgula)" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}><Check className="h-4 w-4 mr-2" />Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.length === 0 ? (
          <Card className="p-8 col-span-full text-center text-muted-foreground">
            Nenhum battle card cadastrado.
          </Card>
        ) : cards.map((c) => {
          const kws = triggers.filter(t => t.battle_card_id === c.id);
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg">{c.competitor_name}</h3>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {c.description && <p className="text-sm text-muted-foreground mb-2">{c.description}</p>}
              <div className="flex flex-wrap gap-1 mb-2">
                {kws.map((t) => <Badge key={t.id} variant="outline" className="text-xs">{t.keyword}</Badge>)}
              </div>
              <div className="text-xs space-y-1">
                <p><span className="text-success font-semibold">{c.our_strengths.length}</span> vantagens</p>
                <p><span className="text-primary font-semibold">{c.talking_points.length}</span> talking points</p>
              </div>
            </Card>
          );
        })}
      </div>
    </NeonPageLayout>
  );
}
