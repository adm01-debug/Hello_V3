import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { UNTAGGED_LABEL, isSameTag } from '@/lib/dialer-favorite-tags';

interface FavoriteTagMenuProps {
  entryName: string;
  currentTag: string | null;
  options: readonly string[];
  onSelect: (tag: string | null) => void;
}

/** Menu compacto para etiquetar (agrupar) um favorito. */
export function FavoriteTagMenu({ entryName, currentTag, options, onSelect }: FavoriteTagMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={
            currentTag
              ? `Etiqueta de ${entryName}: ${currentTag}. Alterar etiqueta`
              : `Definir etiqueta para ${entryName}`
          }
        >
          <Tag className={cn('h-4 w-4', currentTag ? 'text-primary' : 'text-muted-foreground')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Etiqueta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => onSelect(option)}
            className={cn(isSameTag(option, currentTag) && 'font-semibold text-primary')}
          >
            {option}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onSelect(null)}
          className={cn(!currentTag && 'font-semibold text-primary')}
        >
          {UNTAGGED_LABEL}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
