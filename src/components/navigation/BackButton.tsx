import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on root/dashboard
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return null;
  }

  const handleBack = () => {
    // If there's browser history, go back; otherwise go to dashboard
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Voltar para a página anterior"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Voltar</p>
      </TooltipContent>
    </Tooltip>
  );
}
