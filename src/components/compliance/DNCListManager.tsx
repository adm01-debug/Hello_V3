import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Phone, 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Download,
  Ban,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react';
import { useDNCCompliance } from '@/hooks/useDNCCompliance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DNC_REASONS = [
  { value: 'manual', label: 'Adição Manual' },
  { value: 'customer_request', label: 'Solicitação do Cliente' },
  { value: 'complaint', label: 'Reclamação' },
  { value: 'legal', label: 'Determinação Legal' },
  { value: 'opt_out', label: 'Opt-out' },
  { value: 'wrong_number', label: 'Número Incorreto' },
  { value: 'deceased', label: 'Titular Falecido' },
];

export function DNCListManager() {
  const { 
    dncList, 
    isLoadingDNC, 
    addToDNC, 
    removeFromDNC,
    isAddingToDNC,
    bulkImportDNC
  } = useDNCCompliance();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newReason, setNewReason] = useState('manual');
  const [newNotes, setNewNotes] = useState('');
  const [importText, setImportText] = useState('');
  const [importReason, setImportReason] = useState('import');

  const filteredList = dncList.filter(item => 
    item.phone.includes(searchTerm) || 
    item.phone_normalized.includes(searchTerm.replace(/\D/g, '')) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = dncList.filter(item => item.is_active).length;

  const handleAddPhone = () => {
    if (!newPhone.trim()) return;
    
    addToDNC({
      phone: newPhone,
      reason: newReason,
      notes: newNotes || null,
    });

    setNewPhone('');
    setNewReason('manual');
    setNewNotes('');
    setIsAddDialogOpen(false);
  };

  const handleBulkImport = async () => {
    const phones = importText
      .split(/[\n,;]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (phones.length === 0) return;

    const results = await bulkImportDNC(phones, importReason, 'bulk_import');
    
    setImportText('');
    setIsImportDialogOpen(false);
  };

  const handleExport = () => {
    const csv = [
      'Telefone,Telefone Normalizado,Motivo,Fonte,Adicionado Por,Notas,Data',
      ...dncList.map(item => 
        `"${item.phone}","${item.phone_normalized}","${item.reason}","${item.source}","${item.added_by || ''}","${item.notes || ''}","${format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lista_dnc_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getReasonLabel = (reason: string) => {
    return DNC_REASONS.find(r => r.value === reason)?.label || reason;
  };

  const getReasonVariant = (reason: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (reason) {
      case 'complaint':
      case 'legal':
        return 'destructive';
      case 'customer_request':
      case 'opt_out':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <Ban className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total na Lista DNC</p>
                <p className="text-2xl font-bold">{dncList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reclamações</p>
                <p className="text-2xl font-bold">
                  {dncList.filter(item => item.reason === 'complaint').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Lista DNC (Do Not Call)
              </CardTitle>
              <CardDescription>
                Gerencie números que não devem ser contatados
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar Números em Lote</DialogTitle>
                    <DialogDescription>
                      Cole os números de telefone, um por linha ou separados por vírgula.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Motivo da Inclusão</Label>
                      <Select value={importReason} onValueChange={setImportReason}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DNC_REASONS.map(reason => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Números de Telefone</Label>
                      <Textarea
                        placeholder="(11) 99999-9999&#10;(21) 88888-8888&#10;..."
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        {importText.split(/[\n,;]/).filter(p => p.trim()).length} números detectados
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleBulkImport}>
                      Importar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar à Lista DNC</DialogTitle>
                    <DialogDescription>
                      Este número não será mais contatado pelo discador.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo</Label>
                      <Select value={newReason} onValueChange={setNewReason}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DNC_REASONS.map(reason => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações (opcional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Detalhes adicionais..."
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddPhone} disabled={!newPhone.trim() || isAddingToDNC}>
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por telefone ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Adicionado Por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDNC ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum número na lista DNC
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{item.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getReasonVariant(item.reason)}>
                          {getReasonLabel(item.reason)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.source}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.added_by || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover da Lista DNC?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O número {item.phone} poderá ser contatado novamente.
                                Esta ação pode ser revertida adicionando o número novamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => removeFromDNC(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
