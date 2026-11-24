import { useState } from 'react';
import { useComplianceRules } from '@/hooks/useComplianceRules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, Plus, Power, Trash2 } from 'lucide-react';

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  critical: 'destructive',
  warning: 'secondary',
  info: 'default',
};

export function ComplianceRulesPanel() {
  const { rules, isLoading, upsert, toggleActive, remove } = useComplianceRules();
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState('text');
  const [pattern, setPattern] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = () => {
    if (!name.trim() || !pattern.trim() || !message.trim()) return;
    upsert({ rule_name: name.trim(), rule_type: ruleType, pattern: pattern.trim(), message: message.trim(), severity: 'warning', is_active: true });
    setName('');
    setPattern('');
    setMessage('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Nova Regra
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Mencionar concorrente" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Padrão</Label>
            <Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="concorrente|outra empresa" />
          </div>
          <div className="space-y-1">
            <Label>Mensagem</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Treinamento: não citar concorrentes" />
          </div>
          <Button disabled={!name.trim() || !pattern.trim() || !message.trim()} onClick={handleSave}>Salvar Regra</Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
      ) : rules.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma regra de compliance cadastrada.</CardContent></Card>
      ) : (
        rules.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldAlert className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium flex items-center gap-2">
                    {r.rule_name}
                    <Badge variant={SEVERITY_VARIANT[r.severity] ?? 'secondary'}>{r.severity}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{r.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button aria-label={r.is_active ? 'Desativar a regra' : 'Ativar a regra'} aria-pressed={r.is_active} size="icon" variant="ghost" title={r.is_active ? 'Desativar' : 'Ativar'} onClick={() => toggleActive({ id: r.id, is_active: !r.is_active })}>
                  <Power className={`h-4 w-4 ${r.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                </Button>
                <Button aria-label="Excluir a regra" size="icon" variant="ghost" title="Remover" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}