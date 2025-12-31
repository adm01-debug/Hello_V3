import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const analysis = useMemo(() => {
    const requirements: Requirement[] = [
      { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
      { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
      { label: 'Letra minúscula', met: /[a-z]/.test(password) },
      { label: 'Número', met: /[0-9]/.test(password) },
      { label: 'Caractere especial (!@#$%...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];

    const metCount = requirements.filter(r => r.met).length;
    
    let strength: 'empty' | 'weak' | 'fair' | 'good' | 'strong' = 'empty';
    let label = '';
    let color = '';
    let percentage = 0;

    if (password.length === 0) {
      strength = 'empty';
      label = '';
      color = 'bg-muted';
      percentage = 0;
    } else if (metCount <= 2) {
      strength = 'weak';
      label = 'Fraca';
      color = 'bg-red-500';
      percentage = 25;
    } else if (metCount === 3) {
      strength = 'fair';
      label = 'Razoável';
      color = 'bg-orange-500';
      percentage = 50;
    } else if (metCount === 4) {
      strength = 'good';
      label = 'Boa';
      color = 'bg-yellow-500';
      percentage = 75;
    } else {
      strength = 'strong';
      label = 'Forte';
      color = 'bg-green-500';
      percentage = 100;
    }

    return { requirements, strength, label, color, percentage, metCount };
  }, [password]);

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Força da senha</span>
          <span className={cn(
            "text-xs font-medium",
            analysis.strength === 'weak' && 'text-red-500',
            analysis.strength === 'fair' && 'text-orange-500',
            analysis.strength === 'good' && 'text-yellow-500',
            analysis.strength === 'strong' && 'text-green-500',
          )}>
            {analysis.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              analysis.color
            )}
            style={{ width: `${analysis.percentage}%` }}
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
                req.met ? 'text-green-500' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Hook para validar força da senha
export function usePasswordStrength(password: string) {
  return useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const metCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    
    const isStrong = metCount >= 4;
    const isValid = hasMinLength && metCount >= 3;

    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      metCount,
      isStrong,
      isValid,
    };
  }, [password]);
}
