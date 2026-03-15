import { useMemo, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  checkLeaked?: boolean;
}

interface Requirement {
  label: string;
  met: boolean;
  critical?: boolean;
}

// Verifica se a senha foi vazada usando Have I Been Pwned API (k-anonymity)
async function checkPasswordLeaked(password: string): Promise<boolean> {
  if (password.length < 8) return false;
  
  try {
    // Gera SHA-1 hash da senha
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Envia apenas os primeiros 5 caracteres (k-anonymity)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }
    });
    
    if (!response.ok) return false;
    
    const text = await response.text();
    const hashes = text.split('\n');
    
    // Verifica se o sufixo está na lista de hashes vazados
    for (const line of hashes) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return true; // Senha vazada!
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar senha vazada:', error);
    return false;
  }
}

export function PasswordStrength({ password, showRequirements = true, checkLeaked = true }: PasswordStrengthProps) {
  const [isLeaked, setIsLeaked] = useState(false);
  const [isCheckingLeak, setIsCheckingLeak] = useState(false);
  

  // Debounce para verificar senhas vazadas
  useEffect(() => {
    if (!checkLeaked || password.length < 8) {
      setIsLeaked(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingLeak(true);
      const leaked = await checkPasswordLeaked(password);
      setIsLeaked(leaked);
      setIsCheckingLeak(false);
      
      if (leaked) {
        toast.error("Senha comprometida detectada", { description: "Esta senha foi encontrada em vazamentos de dados. Escolha uma senha diferente." });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password, checkLeaked, toast]);

  const analysis = useMemo(() => {
    const requirements: Requirement[] = [
      { label: 'Mínimo 8 caracteres', met: password.length >= 8, critical: true },
      { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
      { label: 'Letra minúscula', met: /[a-z]/.test(password) },
      { label: 'Número', met: /[0-9]/.test(password) },
      { label: 'Caractere especial (!@#$%...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), critical: true },
    ];

    const metCount = requirements.filter(r => r.met).length;
    const criticalMet = requirements.filter(r => r.critical && r.met).length;
    const criticalTotal = requirements.filter(r => r.critical).length;
    
    let strength: 'empty' | 'weak' | 'fair' | 'good' | 'strong' = 'empty';
    let label = '';
    let color = '';
    let percentage = 0;

    if (password.length === 0) {
      strength = 'empty';
      label = '';
      color = 'bg-muted';
      percentage = 0;
    } else if (criticalMet < criticalTotal || metCount <= 2) {
      strength = 'weak';
      label = 'Fraca';
      color = 'bg-destructive';
      percentage = 25;
    } else if (metCount === 3) {
      strength = 'fair';
      label = 'Razoável';
      color = 'bg-warning';
      percentage = 50;
    } else if (metCount === 4) {
      strength = 'good';
      label = 'Boa';
      color = 'bg-call-hold';
      percentage = 75;
    } else {
      strength = 'strong';
      label = 'Forte';
      color = 'bg-success';
      percentage = 100;
    }

    return { requirements, strength, label, color, percentage, metCount, criticalMet, criticalTotal };
  }, [password]);

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Leaked Password Warning */}
      {isLeaked && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <span className="text-xs text-destructive font-medium">
            Senha encontrada em vazamentos! Use outra senha.
          </span>
        </div>
      )}

      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            Força da senha
            {isCheckingLeak && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </span>
          <span className={cn(
            "text-xs font-medium",
            analysis.strength === 'weak' && 'text-destructive',
            analysis.strength === 'fair' && 'text-warning',
            analysis.strength === 'good' && 'text-call-hold',
            analysis.strength === 'strong' && 'text-success',
          )}>
            {analysis.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isLeaked ? 'bg-destructive' : analysis.color
            )}
            style={{ width: `${isLeaked ? 25 : analysis.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1.5">
          {analysis.requirements.map((req, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                req.met ? 'text-success' : req.critical ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span className={cn(req.critical && !req.met && 'font-medium')}>
                {req.label}
                {req.critical && !req.met && ' *'}
              </span>
            </div>
          ))}
          {checkLeaked && (
            <div 
              className={cn(
                "flex items-center gap-1.5 text-xs col-span-2",
                isCheckingLeak ? 'text-muted-foreground' : isLeaked ? 'text-red-400' : password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'
              )}
            >
              {isCheckingLeak ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isLeaked ? (
                <X className="h-3 w-3" />
              ) : password.length >= 8 ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span className={cn(isLeaked && 'font-medium')}>
                Não está em vazamentos conhecidos {isLeaked && '*'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook para validar força da senha
export function usePasswordStrength(password: string) {
  const [isLeaked, setIsLeaked] = useState(false);
  const [isCheckingLeak, setIsCheckingLeak] = useState(false);

  useEffect(() => {
    if (password.length < 8) {
      setIsLeaked(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingLeak(true);
      const leaked = await checkPasswordLeaked(password);
      setIsLeaked(leaked);
      setIsCheckingLeak(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password]);

  return useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const metCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    
    // Requer mínimo de 8 caracteres e caractere especial como obrigatórios
    const isStrong = metCount >= 4 && hasSpecial;
    const isValid = hasMinLength && hasSpecial && metCount >= 3 && !isLeaked;

    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      metCount,
      isStrong,
      isValid,
      isLeaked,
      isCheckingLeak,
    };
  }, [password, isLeaked, isCheckingLeak]);
}
