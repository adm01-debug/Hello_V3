import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Clock, 
  Globe, 
  Check, 
  X,
  Edit,
  Plus
} from 'lucide-react';
import { useDNCCompliance } from '@/hooks/useDNCCompliance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function CallingHoursConfig() {
  const { callingHours, isLoadingHours, checkCallingHours } = useDNCCompliance();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStatus, setCurrentStatus] = useState<{
    can_call: boolean;
    reason: string;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [editingRegion, setEditingRegion] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCheckCurrentStatus = async () => {
    setIsCheckingStatus(true);
    const status = await checkCallingHours('BR');
    setCurrentStatus(status);
    setIsCheckingStatus(false);
  };

  const handleToggleRegion = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('calling_hours_config')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['calling-hours-config'] });
    }
  };

  const handleSaveRegion = async () => {
    if (!editingRegion) return;

    const { error } = await supabase
      .from('calling_hours_config')
      .update({
        weekday_start: editingRegion.weekday_start,
        weekday_end: editingRegion.weekday_end,
        saturday_start: editingRegion.saturday_start || null,
        saturday_end: editingRegion.saturday_end || null,
        sunday_allowed: editingRegion.sunday_allowed,
        sunday_start: editingRegion.sunday_start || null,
        sunday_end: editingRegion.sunday_end || null,
        holidays_allowed: editingRegion.holidays_allowed,
      })
      .eq('id', editingRegion.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Salvo',
        description: 'Configuração de horário atualizada.',
      });
      queryClient.invalidateQueries({ queryKey: ['calling-hours-config'] });
      setIsEditDialogOpen(false);
      setEditingRegion(null);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Atual
              </CardTitle>
              <CardDescription>
                Verifique se é permitido discar no momento atual
              </CardDescription>
            </div>
            <Button 
              onClick={handleCheckCurrentStatus} 
              disabled={isCheckingStatus}
              variant="outline"
            >
              Verificar Agora
            </Button>
          </div>
        </CardHeader>
        {currentStatus && (
          <CardContent>
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              currentStatus.can_call 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              {currentStatus.can_call ? (
                <Check className="h-6 w-6 text-green-500" />
              ) : (
                <X className="h-6 w-6 text-destructive" />
              )}
              <div>
                <p className={`font-medium ${
                  currentStatus.can_call ? 'text-green-500' : 'text-destructive'
                }`}>
                  {currentStatus.can_call ? 'Permitido Discar' : 'Fora do Horário'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentStatus.reason}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Regions Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Horários por Região
          </CardTitle>
          <CardDescription>
            Configure os horários permitidos para discagem em cada região
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Região</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Dias Úteis</TableHead>
                  <TableHead>Sábado</TableHead>
                  <TableHead>Domingo</TableHead>
                  <TableHead>Feriados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHours ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : callingHours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma região configurada
                    </TableCell>
                  </TableRow>
                ) : (
                  callingHours.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{region.region_name}</p>
                          <p className="text-xs text-muted-foreground">{region.region_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {region.timezone}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {formatTime(region.weekday_start)} - {formatTime(region.weekday_end)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {region.saturday_start ? (
                          <span className="font-mono text-sm">
                            {formatTime(region.saturday_start)} - {formatTime(region.saturday_end)}
                          </span>
                        ) : (
                          <Badge variant="secondary">Bloqueado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {region.sunday_allowed ? (
                          <span className="font-mono text-sm">
                            {formatTime(region.sunday_start)} - {formatTime(region.sunday_end)}
                          </span>
                        ) : (
                          <Badge variant="secondary">Bloqueado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={region.holidays_allowed ? 'default' : 'secondary'}>
                          {region.holidays_allowed ? 'Permitido' : 'Bloqueado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={region.is_active}
                          onCheckedChange={() => handleToggleRegion(region.id, region.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRegion({ ...region });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Horários - {editingRegion?.region_name}</DialogTitle>
            <DialogDescription>
              Configure os horários permitidos para discagem nesta região.
            </DialogDescription>
          </DialogHeader>
          
          {editingRegion && (
            <div className="space-y-6 py-4">
              {/* Dias Úteis */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Dias Úteis (Segunda a Sexta)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                      type="time"
                      value={editingRegion.weekday_start}
                      onChange={(e) => setEditingRegion({
                        ...editingRegion,
                        weekday_start: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fim</Label>
                    <Input
                      type="time"
                      value={editingRegion.weekday_end}
                      onChange={(e) => setEditingRegion({
                        ...editingRegion,
                        weekday_end: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Sábado */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Sábado</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                      type="time"
                      value={editingRegion.saturday_start || ''}
                      onChange={(e) => setEditingRegion({
                        ...editingRegion,
                        saturday_start: e.target.value || null
                      })}
                      placeholder="Bloqueado"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fim</Label>
                    <Input
                      type="time"
                      value={editingRegion.saturday_end || ''}
                      onChange={(e) => setEditingRegion({
                        ...editingRegion,
                        saturday_end: e.target.value || null
                      })}
                      placeholder="Bloqueado"
                    />
                  </div>
                </div>
              </div>

              {/* Domingo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Domingo</Label>
                  <Switch
                    checked={editingRegion.sunday_allowed}
                    onCheckedChange={(checked) => setEditingRegion({
                      ...editingRegion,
                      sunday_allowed: checked
                    })}
                  />
                </div>
                {editingRegion.sunday_allowed && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Início</Label>
                      <Input
                        type="time"
                        value={editingRegion.sunday_start || ''}
                        onChange={(e) => setEditingRegion({
                          ...editingRegion,
                          sunday_start: e.target.value || null
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fim</Label>
                      <Input
                        type="time"
                        value={editingRegion.sunday_end || ''}
                        onChange={(e) => setEditingRegion({
                          ...editingRegion,
                          sunday_end: e.target.value || null
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Feriados */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Permitir Feriados</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir discagem em feriados nacionais e regionais
                  </p>
                </div>
                <Switch
                  checked={editingRegion.holidays_allowed}
                  onCheckedChange={(checked) => setEditingRegion({
                    ...editingRegion,
                    holidays_allowed: checked
                  })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRegion}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
