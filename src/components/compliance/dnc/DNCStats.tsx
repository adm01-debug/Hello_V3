import { Card, CardContent } from '@/components/ui/card';
import { Ban, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  total: number;
  active: number;
  complaints: number;
}

export function DNCStats({ total, active, complaints }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <Ban className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total na Lista DNC</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold">{active}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reclamações</p>
              <p className="text-2xl font-bold">{complaints}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
