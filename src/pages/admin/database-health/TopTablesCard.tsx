import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, type TopTable } from "./types";

interface Props {
  isLoading: boolean;
  tables?: TopTable[];
}

export function TopTablesCard({ isLoading, tables }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 15 tabelas por tamanho</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="py-2">Tabela</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Heap</th>
                  <th className="py-2 text-right">Índices</th>
                  <th className="py-2 text-right">Linhas</th>
                </tr>
              </thead>
              <tbody>
                {tables?.map((t) => (
                  <tr key={t.relname} className="border-b border-border/40">
                    <td className="py-2 font-mono">{t.relname}</td>
                    <td className="py-2 text-right">{formatBytes(t.total_bytes)}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {formatBytes(t.heap_bytes)}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {formatBytes(t.index_bytes)}
                    </td>
                    <td className="py-2 text-right">
                      {(t.live_tuples ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
