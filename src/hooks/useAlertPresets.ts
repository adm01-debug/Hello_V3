import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  loadPresets,
  addPreset,
  removePreset,
  type AlertFilterPreset,
} from "@/lib/security-alerts-presets";

const ALL_SOURCES = "__all__";

interface UseAlertPresetsOptions {
  sourceFilter: string;
  searchTerm: string;
  onApply: (preset: AlertFilterPreset) => void;
}

/**
 * Gerencia presets de filtros (persistidos em localStorage).
 */
export function useAlertPresets({ sourceFilter, searchTerm, onApply }: UseAlertPresetsOptions) {
  const [presets, setPresets] = useState<AlertFilterPreset[]>(() => loadPresets());
  const refresh = useCallback(() => setPresets(loadPresets()), []);

  const applyPreset = useCallback(
    (p: AlertFilterPreset) => {
      onApply(p);
      toast.success(`Preset "${p.name}" aplicado`);
    },
    [onApply],
  );

  const savePreset = useCallback(() => {
    const name = window.prompt("Nome do preset:");
    if (!name) return;
    try {
      addPreset({ name, source: sourceFilter || ALL_SOURCES, q: searchTerm });
      refresh();
      toast.success(`Preset "${name.trim()}" salvo`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar preset");
    }
  }, [refresh, searchTerm, sourceFilter]);

  const remove = useCallback(
    (p: AlertFilterPreset) => {
      removePreset(p.id);
      refresh();
      toast.success(`Preset "${p.name}" removido`);
    },
    [refresh],
  );

  return { presets, applyPreset, savePreset, removePreset: remove };
}
