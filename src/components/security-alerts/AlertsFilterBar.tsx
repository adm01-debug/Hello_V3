import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PresetsMenu, type FilterPreset } from "./PresetsMenu";

interface AlertsFilterBarProps {
  sourceFilter: string;
  allSourcesToken: string;
  availableSources: string[];
  searchInput: string;
  onSearchChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  presets: FilterPreset[];
  onApplyPreset: (p: FilterPreset) => void;
  onRemovePreset: (id: string) => void;
  onSavePreset: (name: string) => void;
}

/**
 * Barra de filtros do painel de alertas de segurança (origem + busca +
 * limpar + presets). Extraído de `SecurityAlerts.tsx`.
 */
export function AlertsFilterBar({
  sourceFilter,
  allSourcesToken,
  availableSources,
  searchInput,
  onSearchChange,
  onSourceChange,
  onClear,
  hasActiveFilters,
  filteredCount,
  totalCount,
  presets,
  onApplyPreset,
  onRemovePreset,
  onSavePreset,
}: AlertsFilterBarProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Filtros</CardTitle>
        <div className="flex items-center gap-2">
          <PresetsMenu
            presets={presets}
            allSourcesToken={allSourcesToken}
            onApply={onApplyPreset}
            onRemove={onRemovePreset}
            onSave={onSavePreset}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3">
          <Select value={sourceFilter} onValueChange={onSourceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Origem (source_type)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allSourcesToken}>Todas as origens</SelectItem>
              {availableSources.map((s) => (
                <SelectItem key={s} value={s} className="font-mono text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar por título, mensagem ou origem…"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={onClear} disabled={!hasActiveFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground mt-2">
            Exibindo {filteredCount} de {totalCount} alertas com os filtros aplicados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
