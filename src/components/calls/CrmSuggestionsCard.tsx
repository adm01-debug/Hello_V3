import { useState } from 'react';
import { Database, Check, X, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCrmFieldSuggestions, type CrmFieldSuggestion } from '@/hooks/useCrmFieldSuggestions';

const FIELD_LABELS: Record<string, string> = {
  position: 'Cargo',
  company: 'Empresa',
  pain_point: 'Dor / Problema',
  budget: 'Budget',
  timeline: 'Timeline',
  decision_maker: 'Decisor',
  next_step: 'Próximo passo',
  tags: 'Tags',
};

interface CrmSuggestionsCardProps {
  callSessionId: string;
  contactId?: string | null;
}

export function CrmSuggestionsCard({ callSessionId, contactId }: CrmSuggestionsCardProps) {
  const { pending, accept, reject } = useCrmFieldSuggestions(callSessionId);
  const [editing, setEditing] = useState<Record<string, string>>({});

  if (pending.length === 0) return null;

  const startEdit = (s: CrmFieldSuggestion) => {
    setEditing((e) => ({ ...e, [s.id]: s.suggested_value }));
  };

  const cancelEdit = (id: string) => {
    setEditing((e) => {
      const { [id]: _drop, ...rest } = e;
      return rest;
    });
  };

  const apply = (s: CrmFieldSuggestion) => {
    const value = editing[s.id] ?? s.suggested_value;
    accept({ id: s.id, contactId: contactId ?? null, field: s.field_name, value });
    cancelEdit(s.id);
  };

  return (
    <Card className="p-3 bg-card/60 backdrop-blur border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Sugestões para CRM</span>
        </div>
        <Badge variant="outline" className="text-xs">{pending.length}</Badge>
      </div>
      <ScrollArea className="max-h-64 pr-2">
        <div className="space-y-2">
          {pending.map((s) => {
            const isEditing = s.id in editing;
            return (
              <div key={s.id} className="rounded-md border border-primary/20 p-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{FIELD_LABELS[s.field_name] ?? s.field_name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {Math.round((s.confidence ?? 0) * 100)}%
                  </Badge>
                </div>
                {s.current_value && (
                  <p className="text-muted-foreground line-through">Atual: {s.current_value}</p>
                )}
                {isEditing ? (
                  <Input
                    value={editing[s.id]}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="h-7 text-xs"
                  />
                ) : (
                  <p className="text-foreground">{s.suggested_value}</p>
                )}
                {s.source_quote && (
                  <p className="text-[10px] italic text-muted-foreground line-clamp-2">"{s.source_quote}"</p>
                )}
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="default" className="h-6 text-xs gap-1" onClick={() => apply(s)}>
                    <Check className="h-3 w-3" /> Aplicar
                  </Button>
                  {!isEditing && (
                    <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => startEdit(s)}>
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                  )}
                  {isEditing && (
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => cancelEdit(s.id)}>
                      Cancelar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-muted-foreground" onClick={() => reject(s.id)}>
                    <X className="h-3 w-3" /> Descartar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
