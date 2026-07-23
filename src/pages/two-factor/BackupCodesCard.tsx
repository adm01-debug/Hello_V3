import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertTriangle, Copy } from 'lucide-react';

interface Props {
  codes: string[];
  onCopy: (text: string) => void;
}

export function BackupCodesCard({ codes, onCopy }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Códigos de Backup
        </CardTitle>
        <CardDescription>
          Use estes códigos caso perca acesso aos seus dispositivos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {codes.length > 0 ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {codes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-background rounded"
                >
                  <span>{code}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => onCopy(codes.join('\n'))} className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Todos os Códigos
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ative o 2FA para gerar códigos de backup</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
