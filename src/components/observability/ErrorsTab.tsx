import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle } from 'lucide-react';
import type { getErrorReports } from '@/lib/error-tracking';

import { safeToLocaleString } from "@/lib/safe-date";
type ErrorReport = ReturnType<typeof getErrorReports>[number];

interface Props {
  errors: readonly ErrorReport[];
}

export function ErrorsTab({ errors }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Erros Capturados</CardTitle>
        <CardDescription>Últimos {errors.length} erros em runtime</CardDescription>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mb-2 text-green-500" />
            <p>Nenhum erro capturado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.slice().reverse().map((err, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge variant={err.type === 'error' ? 'destructive' : 'secondary'}>
                      {err.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-mono text-sm">
                    {err.message}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {err.filename ? `${err.filename}:${err.lineno}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {safeToLocaleString(err.timestamp, 'pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
