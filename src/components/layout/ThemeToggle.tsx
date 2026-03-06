import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
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
  );
}
