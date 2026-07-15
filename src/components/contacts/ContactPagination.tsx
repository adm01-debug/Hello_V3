import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface Props {
  page: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

export const ContactPagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (clamped - 1) * pageSize + 1;
  const to = Math.min(clamped * pageSize, total);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border/40 pt-4 sm:flex-row">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {total === 0 ? 'Nenhum resultado' : `Exibindo ${from}–${to} de ${total}`}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Por página</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v) as PageSize)}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Primeira página"
            disabled={clamped <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Página anterior"
            disabled={clamped <= 1}
            onClick={() => onPageChange(clamped - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[72px] text-center text-xs tabular-nums text-muted-foreground">
            {clamped} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Próxima página"
            disabled={clamped >= totalPages}
            onClick={() => onPageChange(clamped + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Última página"
            disabled={clamped >= totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
