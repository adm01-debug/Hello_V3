import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ban, Search, Download } from 'lucide-react';
import { useDNCCompliance } from '@/hooks/useDNCCompliance';
import { format } from 'date-fns';
import { DNCStats } from './dnc/DNCStats';
import { AddDNCDialog } from './dnc/AddDNCDialog';
import { ImportDNCDialog } from './dnc/ImportDNCDialog';
import { DNCTable } from './dnc/DNCTable';

export function DNCListManager() {
  const { dncList, isLoadingDNC, addToDNC, removeFromDNC, isAddingToDNC, bulkImportDNC } = useDNCCompliance();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredList = dncList.filter(item =>
    item.phone.includes(searchTerm) ||
    item.phone_normalized.includes(searchTerm.replace(/\D/g, '')) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = dncList.filter(item => item.is_active).length;
  const complaintCount = dncList.filter(item => item.reason === 'complaint').length;

  const handleExport = () => {
    const csv = [
      'Telefone,Telefone Normalizado,Motivo,Fonte,Adicionado Por,Notas,Data',
      ...dncList.map(item =>
        `"${item.phone}","${item.phone_normalized}","${item.reason}","${item.source}","${item.added_by || ''}","${item.notes || ''}","${format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lista_dnc_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <DNCStats total={dncList.length} active={activeCount} complaints={complaintCount} />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Lista DNC (Do Not Call)
              </CardTitle>
              <CardDescription>Gerencie números que não devem ser contatados</CardDescription>
            </div>

            <div className="flex gap-2">
              <ImportDNCDialog
                onImport={async (phones, reason) => { await bulkImportDNC(phones, reason, 'bulk_import'); }}
              />
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <AddDNCDialog
                isAdding={isAddingToDNC}
                onAdd={(payload) => addToDNC(payload)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por telefone ou motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DNCTable items={filteredList} isLoading={isLoadingDNC} onRemove={removeFromDNC} />

          {filteredList.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Mostrando 50 de {filteredList.length} registros
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
