import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, MessageSquare } from 'lucide-react';

interface Factor {
  id: string;
  type: string;
  status: string;
  friendly_name?: string | null;
}

interface Props {
  factors: Factor[];
  onDisable: (id: string) => void;
}

export function DevicesCard({ factors, onDisable }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Fatores de Autenticação Configurados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {factors.length > 0 ? (
          <div className="space-y-2">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {factor.type === 'totp' ? (
                    <Smartphone className="h-5 w-5 text-info" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-success" />
                  )}
                  <div>
                    <p className="font-medium">
                      {factor.friendly_name || (factor.type === 'totp' ? 'Autenticador' : 'SMS')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {factor.type.toUpperCase()} •{' '}
                      {factor.status === 'verified' ? 'Verificado' : 'Pendente'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onDisable(factor.id)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum fator de autenticação configurado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
