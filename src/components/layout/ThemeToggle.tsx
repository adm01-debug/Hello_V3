import { Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type ThemeSkin } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const skins: { id: ThemeSkin; label: string; color: string; description: string }[] = [
  { id: 'default', label: 'Esmeralda', color: 'bg-emerald-500', description: 'Padrão verde esmeralda' },
  { id: 'midnight', label: 'Midnight', color: 'bg-indigo-500', description: 'Azul índigo profundo' },
  { id: 'ocean', label: 'Ocean', color: 'bg-cyan-500', description: 'Azul oceano vibrante' },
  { id: 'sunset', label: 'Sunset', color: 'bg-orange-500', description: 'Laranja pôr do sol' },
  { id: 'forest', label: 'Forest', color: 'bg-lime-600', description: 'Verde floresta natural' },
];

export function ThemeToggle() {
  const { theme, toggleTheme, skin, setSkin } = useTheme();

  return (
     <div className="flex items-center gap-1.5 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.06] backdrop-blur-xl shadow-inner">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
             className="h-10 w-10 rounded-xl hover:bg-white/[0.05] transition-all duration-500 hover:scale-105 active:scale-95"
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/[0.05] transition-all duration-300" aria-label="Escolher skin">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Skins</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Skin Visual</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {skins.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => setSkin(s.id)}
              className={cn('gap-3 cursor-pointer', skin === s.id && 'bg-accent')}
            >
              <div className={cn('h-4 w-4 rounded-full shrink-0', s.color)} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.description}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
