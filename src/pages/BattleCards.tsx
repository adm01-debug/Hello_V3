import { useEffect, useMemo, useState } from 'react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Swords, Plus, Trash2, Edit, Check, Search, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
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

// These tables are not present in the generated Supabase Database types,
// so use an untyped client view for them.
const db = supabase as unknown as SupabaseClient;

export default function BattleCards() {
  usePageTitle('Battle Cards');
  const [cards, setCards] = useState<BattleCard[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    const [{ data: c }, { data: t }] = await Promise.all([
      db.from('battle_cards').select('*').order('competitor_name'),
      db.from('battle_card_triggers').select('*'),
    ]);
    setCards((c || []) as BattleCard[]);
    setTriggers((t || []) as Trigger[]);
  };

  useEffect(() => { load(); }, []);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return cards;
    const q = search.toLowerCase();
    return cards.filter(c =>
      c.competitor_name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      triggers.some(t => t.battle_card_id === c.id && t.keyword.toLowerCase().includes(q))
    );
  }, [cards, triggers, search]);

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
      const { error } = await db.from('battle_cards').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await db.from('battle_cards').insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      cardId = data.id;
    }

    if (cardId) {
      await db.from('battle_card_triggers').delete().eq('battle_card_id', cardId);
      const kws = form.keywords.split(',').map(k => k.trim()).filter(Boolean);
      if (kws.length > 0) {
        await db.from('battle_card_triggers').insert(
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
    const { error } = await db.from('battle_cards').delete().eq('id', id);
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

  const renderDialog = () => (
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
  );

  return (
    <NeonPageLayout>
      <NeonPageHeader
        icon={<Swords className="h-5 w-5" />}
        title="Battle Cards"
        description="Cartões competitivos disparados em tempo real durante a chamada"
        actions={renderDialog()}
      />

      {cards.length > 0 && (
        <Card className="p-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por concorrente, descrição ou palavra-chave…"
              className="pl-9"
            />
          </div>
        </Card>
      )}

      {cards.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-primary/30 bg-card/50 backdrop-blur-md shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhum battle card ainda</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie seu primeiro battle card para que o sistema dispare automaticamente alertas com vantagens competitivas quando concorrentes forem mencionados durante uma chamada.
          </p>
          {renderDialog()}
        </Card>
      ) : filteredCards.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum resultado para "{search}".
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((c) => {
            const kws = triggers.filter(t => t.battle_card_id === c.id);
            return (
              <Card key={c.id} className="p-4 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
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
      )}
    </NeonPageLayout>
  );
}
