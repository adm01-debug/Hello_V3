import { useEffect, useRef, useState } from 'react';
import { Bookmark, Loader2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSavedFilters } from '@/hooks/useSavedFilters';

interface Props<T> {
  entityType: string;
  current: T;
  onApply: (filters: T) => void;
}

/**
 * Barra de filtros salvos: aplica, salva, marca como padrão e remove presets do
 * usuário. O preset marcado como padrão é aplicado uma única vez ao abrir a tela.
 */
export const SavedFiltersBar = <T,>({ entityType, current, onApply }: Props<T>) => {
  const { savedFilters, isLoading, isSaving, error, saveFilter, deleteFilter, setDefaultFilter } =
    useSavedFilters<T>(entityType);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const appliedDefault = useRef(false);

  useEffect(() => {
    if (appliedDefault.current || isLoading) return;
    const preset = savedFilters.find((f) => f.is_default);
    if (!preset) return;
    appliedDefault.current = true;
    onApply(preset.filters);
  }, [isLoading, savedFilters, onApply]);

  const handleSave = async () => {
    const result = await saveFilter({ name, filters: current, isDefault: makeDefault });
    if (result.ok) {
      toast.success('Filtro salvo', { description: `"${name.trim()}" fica disponível aqui na próxima visita` });
      setIsDialogOpen(false);
      setName('');
      setMakeDefault(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros salvos">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
        Filtros salvos
      </span>

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-label="Carregando filtros salvos" />
      ) : null}

      {!isLoading && savedFilters.length === 0 ? (
        <span className="text-xs text-muted-foreground">Nenhum filtro salvo ainda.</span>
      ) : null}

      {savedFilters.map((preset) => (
        <div key={preset.id} className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 rounded-r-none px-2 text-xs"
            onClick={() => onApply(preset.filters)}
          >
            {preset.is_default ? (
              <Star className="h-3 w-3 fill-current" aria-label="Filtro padrão" />
            ) : null}
            {preset.name}
          </Button>
          {!preset.is_default ? (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-none border-l-0"
              aria-label={`Definir ${preset.name} como padrão`}
              onClick={() => void setDefaultFilter(preset.id)}
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-l-none border-l-0"
            aria-label={`Remover filtro ${preset.name}`}
            onClick={() => void deleteFilter(preset.id)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            Salvar filtro atual
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar filtro atual</DialogTitle>
            <DialogDescription>
              O preset guarda a busca e os filtros desta tela para você reaplicar depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="saved-filter-name">Nome</Label>
              <Input
                id="saved-filter-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Clientes Bitrix com telefone"
                maxLength={60}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="saved-filter-default"
                checked={makeDefault}
                onCheckedChange={(checked) => setMakeDefault(Boolean(checked))}
              />
              <Label htmlFor="saved-filter-default" className="text-sm font-normal">
                Aplicar automaticamente ao abrir a tela
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving || !name.trim()}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
};
