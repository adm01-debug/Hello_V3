import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { statusIcons } from './constants';

interface ServiceStatus {
  name: string;
  status: string;
  latency?: number;
  error?: string;
}

interface Props {
  services: ServiceStatus[];
}

export function HealthTab({ services }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcons[service.status]}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.latency !== undefined ? `${service.latency}ms` : 'Verificando...'}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  service.status === 'healthy' ? 'default' :
                  service.status === 'degraded' ? 'secondary' :
                  service.status === 'down' ? 'destructive' : 'outline'
                }>
                  {service.status === 'healthy' ? 'OK' :
                    service.status === 'down' ? 'Offline' :
                      service.status === 'checking' ? '...' : 'Degradado'}
                </Badge>
              </div>
              {service.error && (
                <p className="text-xs text-destructive mt-2 truncate">{service.error}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latência dos Serviços</CardTitle>
          <CardDescription>Tempo de resposta em milissegundos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={services.filter(s => s.latency !== undefined).map(s => ({ name: s.name, latency: s.latency }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="latency" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
