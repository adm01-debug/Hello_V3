import { useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Contact } from '@/hooks/useContacts';

export type ContactSort = 'recent' | 'name-asc' | 'name-desc' | 'company';
export type ContactSourceFilter = 'all' | 'manual' | 'bitrix24' | 'auto';

export interface ContactFiltersState {
  source: ContactSourceFilter;
  hasPhone: boolean;
  hasEmail: boolean;
  company: string | null;
  tag: string | null;
  sort: ContactSort;
}

export const defaultContactFilters: ContactFiltersState = {
  source: 'all',
  hasPhone: false,
  hasEmail: false,
  company: null,
  tag: null,
  sort: 'recent',
};

interface Props {
  contacts: Contact[];
  value: ContactFiltersState;
  onChange: (value: ContactFiltersState) => void;
}

export const ContactFilters = ({ contacts, value, onChange }: Props) => {
  const { companies, tags } = useMemo(() => {
    const compSet = new Set<string>();
    const tagSet = new Set<string>();
    for (const c of contacts) {
      if (c.company) compSet.add(c.company);
      c.tags?.forEach((t) => t && tagSet.add(t));
    }
    return {
      companies: Array.from(compSet).sort((a, b) => a.localeCompare(b)).slice(0, 100),
      tags: Array.from(tagSet).sort((a, b) => a.localeCompare(b)).slice(0, 100),
    };
  }, [contacts]);

  const activeCount =
    (value.source !== 'all' ? 1 : 0) +
    (value.hasPhone ? 1 : 0) +
    (value.hasEmail ? 1 : 0) +
    (value.company ? 1 : 0) +
    (value.tag ? 1 : 0) +
    (value.sort !== 'recent' ? 1 : 0);

  const update = <K extends keyof ContactFiltersState>(
    key: K,
    v: ContactFiltersState[K],
  ) => onChange({ ...value, [key]: v });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 border-border/50 hover:border-primary/30">
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary/15 text-primary text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Filtrar contatos</p>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onChange(defaultContactFilters)}
            >
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Origem</Label>
          <Select
            value={value.source}
            onValueChange={(v) => update('source', v as ContactSourceFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="bitrix24">Bitrix24</SelectItem>
              <SelectItem value="auto">Automático</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Empresa</Label>
          <Select
            value={value.company ?? '__all__'}
            onValueChange={(v) => update('company', v === '__all__' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="__all__">Todas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tag</Label>
            <Select
              value={value.tag ?? '__all__'}
              onValueChange={(v) => update('tag', v === '__all__' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="__all__">Todas</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Requisitos</Label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.hasPhone}
              onCheckedChange={(c) => update('hasPhone', Boolean(c))}
            />
            Com telefone
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.hasEmail}
              onCheckedChange={(c) => update('hasEmail', Boolean(c))}
            />
            Com email
          </label>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Ordenar por</Label>
          <Select value={value.sort} onValueChange={(v) => update('sort', v as ContactSort)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Atualizados recentemente</SelectItem>
              <SelectItem value="name-asc">Nome (A → Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z → A)</SelectItem>
              <SelectItem value="company">Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
};
