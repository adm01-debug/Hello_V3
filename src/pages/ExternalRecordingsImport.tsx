import { useState } from 'react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function ExternalRecordingsImport() {
  usePageTitle('Importar Gravações Externas');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const importTeams = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('teams-fetch-recordings', { body: {} });
      if (error) throw error;
      setLastResult(JSON.stringify(data, null, 2));
      toast.success(`Importação concluída: ${data?.imported ?? 0} registros`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao importar';
      toast.error(msg);
      setLastResult(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        icon={<Cloud className="h-5 w-5" />}
        title="Importar Gravações Externas"
        description="Importe gravações de reuniões de plataformas externas para a biblioteca interna"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Cloud className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Microsoft Teams</h3>
              <p className="text-sm text-muted-foreground">
                Importa metadados de gravações dos seus times no Teams.
              </p>
            </div>
          </div>
          <Button onClick={importTeams} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Importar do Teams
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Requer conector Microsoft Teams ativo com permissões de leitura de reuniões.
          </p>
        </Card>

        <Card className="p-6 opacity-60">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-lg bg-muted p-2">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Zoom / Google Meet</h3>
              <p className="text-sm text-muted-foreground">
                Em breve. Requer configuração OAuth dedicada.
              </p>
            </div>
          </div>
          <Button disabled className="w-full">Em breve</Button>
        </Card>
      </div>

      {lastResult && (
        <Card className="p-4 mt-6">
          <h4 className="font-semibold mb-2 text-sm">Resultado da última importação</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{lastResult}</pre>
        </Card>
      )}
    </NeonPageLayout>
  );
}
