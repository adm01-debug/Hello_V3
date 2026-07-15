import { useState } from 'react';
import { Check, Clock, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CallingHoursRegion } from './types';

interface Props {
  regions: CallingHoursRegion[];
  onCheck: (regionCode: string) => Promise<{ can_call: boolean; reason: string } | null>;
}

export const StatusCheckCard = ({ regions, onCheck }: Props) => {
  const [region, setRegion] = useState<string>(regions[0]?.region_code ?? 'BR');
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ can_call: boolean; reason: string } | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const result = await onCheck(region);
      setStatus(result);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status Atual
            </CardTitle>
            <CardDescription>
              Verifique se é permitido discar agora em uma região configurada
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.region_code}>
                    {r.region_name} ({r.region_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCheck} disabled={checking || regions.length === 0} variant="outline">
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar agora
            </Button>
          </div>
        </div>
      </CardHeader>
      {status && (
        <CardContent>
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-3 p-4 rounded-lg border ${
              status.can_call
                ? 'bg-success/10 border-success/20'
                : 'bg-destructive/10 border-destructive/20'
            }`}
          >
            {status.can_call ? (
              <Check className="h-6 w-6 text-success" />
            ) : (
              <X className="h-6 w-6 text-destructive" />
            )}
            <div>
              <p className={`font-medium ${status.can_call ? 'text-success' : 'text-destructive'}`}>
                {status.can_call ? 'Permitido discar' : 'Fora do horário'}
              </p>
              <p className="text-sm text-muted-foreground">{status.reason}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
