import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lotesParaConsulta, normalizarTelefone, reconciliarDNC, type ReconciliacaoDNC } from '@/lib/dnc/reconcile';
import type { DNCBulkImportResult } from '@/hooks/useDNCCompliance';
import { mensagemDeErro } from '@/lib/error-message';

interface Props {
  onResend: (phones: string[]) => DNCBulkImportResult | void | Promise<DNCBulkImportResult | void>;
}

async function buscarNormalizados(numeros: string[]): Promise<string[]> {
  const encontrados: string[] = [];
  for (const lote of lotesParaConsulta(numeros)) {
    const { data, error } = await supabase
      .from('dnc_list')
      .select('phone_normalized')
      .in('phone_normalized', lote);
    if (error) throw error;
    for (const linha of (data ?? []) as Array<{ phone_normalized: string }>) {
      encontrados.push(linha.phone_normalized);
    }
  }
  return encontrados;
}

export function ReconcileDNCDialog({ onResend }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [conferindo, setConferindo] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [resultado, setResultado] = useState<ReconciliacaoDNC | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [reenvio, setReenvio] = useState<DNCBulkImportResult | null>(null);

  const telefones = () => text.split(/[\n,;]/).map((p) => p.trim()).filter((p) => p.length > 0);

  const conferir = async (limparReenvio = true) => {
    const lista = telefones();
    if (lista.length === 0) return;
    setConferindo(true);
    setErro(null);
    if (limparReenvio) setReenvio(null);
    try {
      const normalizados = [...new Set(lista.map(normalizarTelefone).filter((n) => n.length >= 8))];
      const naLista = await buscarNormalizados(normalizados);
      setResultado(reconciliarDNC(lista, naLista));
    } catch (e) {
      setErro(mensagemDeErro(e));
      setResultado(null);
    } finally {
      setConferindo(false);
    }
  };

  const reenviar = async () => {
    if (!resultado || resultado.ausentes.length === 0) return;
    setReenviando(true);
    try {
      const res = await onResend(resultado.ausentes);
      setReenvio(res ?? { success: resultado.ausentes.length, failed: 0, duplicates: 0 });
      await conferir(false);
    } finally {
      setReenviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next);
      if (!next) { setResultado(null); setReenvio(null); setErro(null); }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><ClipboardCheck className="h-4 w-4 mr-2" />Conferir lista</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conferir a lista DNC</DialogTitle>
          <DialogDescription>
            Cole os números de um arquivo já importado. A conferência mostra quais não estão na lista hoje —
            importação antiga pode ter contado como sucesso o que o banco recusou.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="space-y-2">
            <Label>Números do arquivo</Label>
            <Textarea
              placeholder="(11) 99999-9999&#10;(21) 88888-8888&#10;..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-destructive">
              Não foi possível conferir a lista: {erro}
            </p>
          )}

          {resultado && (
            <div className="space-y-2" role="status">
              <p className="text-sm">
                {resultado.presentes.length} já estão na lista, {resultado.ausentes.length} ausentes
                {resultado.invalidos.length > 0 ? `, ${resultado.invalidos.length} inválidos ignorados` : ''}.
              </p>
              {resultado.ausentes.length > 0 && (
                <div className="max-h-32 overflow-auto rounded-md border border-border p-2 text-xs">
                  <ul className="space-y-0.5">
                    {resultado.ausentes.slice(0, 100).map((n) => <li key={n}>{n}</li>)}
                  </ul>
                  {resultado.ausentes.length > 100 && (
                    <p className="text-muted-foreground mt-1">+{resultado.ausentes.length - 100} números</p>
                  )}
                </div>
              )}
            </div>
          )}

          {reenvio && (
            <p className="text-sm text-muted-foreground">
              Reenvio: {reenvio.success} importados, {reenvio.duplicates} duplicados, {reenvio.failed} falharam.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
          <Button variant="outline" onClick={() => conferir()} disabled={conferindo}>
            {conferindo ? 'Conferindo...' : 'Conferir'}
          </Button>
          <Button onClick={reenviar} disabled={!resultado || resultado.ausentes.length === 0 || reenviando}>
            {reenviando ? 'Reenviando...' : 'Reenviar só os ausentes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
