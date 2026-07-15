import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, Zap, Search, Clock, BarChart3 } from 'lucide-react';
import type { LoadTestStats } from './constants';

interface Props {
  result: LoadTestStats | null;
  isRunning: boolean;
  onRun: () => void;
}

export function LoadTestTab({ result, isRunning, onRun }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Simulação de Carga VoIP</h3>
          <p className="text-sm text-muted-foreground">Valida latência e gargalos do banco de dados sob estresse</p>
        </div>
        <Button onClick={onRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
          Iniciar Teste Real
        </Button>
      </div>

      {result && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Zap className="h-4 w-4" /> Latência Inserção
              </div>
              <p className="text-2xl font-bold">{result.insert_latency_avg_ms.toFixed(2)}ms</p>
              <Badge variant={result.insert_latency_avg_ms < 50 ? 'default' : 'destructive'} className="mt-1">
                {result.insert_latency_avg_ms < 50 ? 'Excelente' : 'Degradado'}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Search className="h-4 w-4" /> Latência Query
              </div>
              <p className="text-2xl font-bold">{result.select_latency_ms.toFixed(2)}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" /> Duração Total
              </div>
              <p className="text-2xl font-bold">{result.total_duration_ms.toFixed(2)}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BarChart3 className="h-4 w-4" /> Registros
              </div>
              <p className="text-2xl font-bold">{result.records_processed}</p>
              <p className="text-xs text-muted-foreground mt-1">Lote SIP Processado</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
