import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { useWhatsappRewrite, type RewriteTone } from "@/hooks/useWhatsappRewrite";

interface WhatsappComposerProps {
  value: string;
  onChange: (next: string) => void;
  onSend?: () => void;
  context?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TONES: { key: RewriteTone; label: string }[] = [
  { key: "profissional", label: "Profissional" },
  { key: "amigavel", label: "Amigável" },
  { key: "conciso", label: "Conciso" },
  { key: "empatico", label: "Empático" },
];

/**
 * Compositor de mensagem WhatsApp com botão "Melhorar com IA" (Lovable AI Gateway).
 */
export function WhatsappComposer({
  value,
  onChange,
  onSend,
  context,
  placeholder = "Escreva a mensagem…",
  disabled,
}: WhatsappComposerProps) {
  const { rewrite, loading } = useWhatsappRewrite();
  const [selectedTone, setSelectedTone] = useState<RewriteTone>("profissional");

  const handleRewrite = async (tone: RewriteTone) => {
    setSelectedTone(tone);
    const next = await rewrite(value, tone, context);
    if (next) onChange(next);
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={disabled || loading}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => handleRewrite(selectedTone)}
            disabled={loading || !value.trim() || disabled}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-1.5">Melhorar com IA</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" disabled={loading || disabled} type="button">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Escolha o tom</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TONES.map((t) => (
                <DropdownMenuItem key={t.key} onClick={() => handleRewrite(t.key)}>
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {onSend && (
          <Button
            type="button"
            size="sm"
            onClick={onSend}
            disabled={loading || !value.trim() || disabled}
          >
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}
