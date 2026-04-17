import { useState } from 'react';
import { useSkills } from '@/hooks/useSkills';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Plus, Award } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Skills() {
  usePageTitle('Habilidades');
  const { skills, agentSkills, createSkill, upsertAgentSkill } = useSkills();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'general', description: '' });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createSkill({ ...form, is_active: true });
    setForm({ name: '', category: 'general', description: '' });
    setOpen(false);
  };

  const grouped: Record<string, typeof skills> = {};
  skills.forEach(s => {
    grouped[s.category] = grouped[s.category] || [];
    grouped[s.category].push(s);
  });

  const agentMap: Record<string, Record<string, number>> = {};
  agentSkills.forEach(as => {
    agentMap[as.agent_name] = agentMap[as.agent_name] || {};
    agentMap[as.agent_name][as.skill_id] = as.proficiency;
  });

  return (
    <NeonPageLayout>
      <NeonPageHeader title="Habilidades" subtitle="Catálogo e proficiência por agente" icon={Award} />

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catálogo ({skills.length})</TabsTrigger>
          <TabsTrigger value="matrix">Matriz por Agente</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4 mt-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Habilidade</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Habilidade</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={handleCreate}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {Object.entries(grouped).map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader className="pb-2"><CardTitle className="text-base capitalize">{cat}</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {items.map(s => (
                  <Badge key={s.id} variant="outline" className="gap-1"><Star className="h-3 w-3" />{s.name}</Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-accent/30">
                  <tr><th className="p-2 text-left">Agente</th>{skills.map(s => <th key={s.id} className="p-2 text-center text-xs">{s.name}</th>)}</tr>
                </thead>
                <tbody>
                  {Object.entries(agentMap).map(([agent, skillMap]) => (
                    <tr key={agent} className="border-t border-border">
                      <td className="p-2 font-medium">{agent}</td>
                      {skills.map(s => (
                        <td key={s.id} className="p-2 text-center">
                          {skillMap[s.id] ? <Badge variant="secondary">{skillMap[s.id]}/5</Badge> : <span className="text-muted-foreground">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {Object.keys(agentMap).length === 0 && (
                    <tr><td colSpan={skills.length + 1} className="p-8 text-center text-muted-foreground">Nenhuma proficiência cadastrada</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </NeonPageLayout>
  );
}
