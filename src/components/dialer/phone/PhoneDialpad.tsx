import { Delete, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DIAL_KEYS, DIAL_LETTERS, formatPhoneDisplay, isDialable } from './phone-utils';

interface PhoneDialpadProps {
  value: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onCall: () => void;
  disabled?: boolean;
}

/** Teclado 3x4 com display e botão de chamada. */
export function PhoneDialpad({
  value,
  onDigit,
  onBackspace,
  onClear,
  onCall,
  disabled = false,
}: PhoneDialpadProps) {
  const canCall = isDialable(value) && !disabled;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-[72px] items-center justify-center px-2">
        <p
          className="truncate text-center text-3xl font-semibold tracking-wide text-foreground sm:text-4xl"
          aria-live="polite"
          aria-label="Número digitado"
        >
          {formatPhoneDisplay(value) || <span className="text-muted-foreground/50">Digite o número</span>}
        </p>
      </div>

      <div className="mx-auto mt-4 grid w-full max-w-[300px] grid-cols-3 gap-3">
        {DIAL_KEYS.map((key) => (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onDigit(key)}
            disabled={disabled}
            aria-label={`Discar ${key}`}
            className={cn(
              'flex h-16 w-full flex-col items-center justify-center rounded-full border border-border/50',
              'bg-card/70 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            )}
          >
            <span className="text-2xl font-medium leading-none">{key}</span>
            {DIAL_LETTERS[key] ? (
              <span className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground">
                {DIAL_LETTERS[key]}
              </span>
            ) : null}
          </motion.button>
        ))}
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-[300px] grid-cols-3 items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={!value || disabled}
          className="justify-self-start text-muted-foreground"
        >
          Limpar
        </Button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onCall}
          disabled={!canCall}
          aria-label="Iniciar chamada"
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground',
            'shadow-lg transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <PhoneCall className="h-7 w-7" />
        </motion.button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBackspace}
          disabled={!value || disabled}
          aria-label="Apagar último dígito"
          className="justify-self-end"
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
