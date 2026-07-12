import { Bookmark, BookmarkPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AlertFilterPreset } from "@/lib/security-alerts-presets";

interface PresetsMenuProps {
  presets: AlertFilterPreset[];
  allSourcesToken: string;
  onApply: (preset: AlertFilterPreset) => void;
  onRemove: (preset: AlertFilterPreset) => void;
  onSave: () => void;
}

/**
 * Dropdown de presets de filtros de alertas de segurança.
 * Extraído de SecurityAlerts.tsx para reduzir complexidade da página.
 */
export function PresetsMenu({
  presets,
  allSourcesToken,
  onApply,
  onRemove,
  onSave,
}: PresetsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="w-4 h-4 mr-2" />
          Presets {presets.length > 0 ? `(${presets.length})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Presets salvos</DropdownMenuLabel>
        {presets.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Nenhum preset ainda. Ajuste os filtros e clique em "Salvar como preset".
          </div>
        ) : (
          presets.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1 px-1 py-0.5 hover:bg-accent/50 rounded-sm"
            >
              <button
                type="button"
                onClick={() => onApply(p)}
                className="flex-1 text-left px-2 py-1.5 text-sm truncate"
                title={`origem: ${p.source === allSourcesToken ? "todas" : p.source} • busca: ${p.q || "—"}`}
              >
                <div className="truncate font-medium">{p.name}</div>
                <div className="truncate text-[10px] text-muted-foreground font-mono">
                  {p.source === allSourcesToken ? "todas" : p.source}
                  {p.q ? ` · "${p.q}"` : ""}
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(p)}
                title="Remover preset"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSave}>
          <BookmarkPlus className="w-4 h-4 mr-2" />
          Salvar filtros atuais como preset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
