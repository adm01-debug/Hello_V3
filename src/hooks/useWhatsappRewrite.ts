import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export type RewriteTone = "profissional" | "amigavel" | "conciso" | "empatico";

interface RewriteResponse {
  rewritten: string;
  tone: RewriteTone;
  originalLength: number;
  rewrittenLength: number;
}

interface RewriteError {
  error: string;
  details?: unknown;
}

interface UseWhatsappRewriteResult {
  rewrite: (message: string, tone?: RewriteTone, context?: string) => Promise<string | null>;
  loading: boolean;
  lastResult: RewriteResponse | null;
}

export function useWhatsappRewrite(): UseWhatsappRewriteResult {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<RewriteResponse | null>(null);

  const rewrite = useCallback(
    async (message: string, tone: RewriteTone = "profissional", context?: string): Promise<string | null> => {
      if (!message.trim()) {
        toast.error("Digite uma mensagem para melhorar");
        return null;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<RewriteResponse | RewriteError>(
          "whatsapp-rewrite",
          { body: { message: message.trim(), tone, context } },
        );

        if (error) {
          logger.error("whatsapp-rewrite invoke failed", error);
          toast.error("Não foi possível melhorar a mensagem");
          return null;
        }

        if (data && "error" in data) {
          toast.error(data.error);
          return null;
        }

        if (!data || !("rewritten" in data)) {
          toast.error("Resposta inválida do serviço de IA");
          return null;
        }

        setLastResult(data);
        toast.success("Mensagem melhorada com IA");
        return data.rewritten;
      } catch (err) {
        logger.error("whatsapp-rewrite exception", err);
        toast.error("Erro ao contactar o serviço de IA");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { rewrite, loading, lastResult };
}
