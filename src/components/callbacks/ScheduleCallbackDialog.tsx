import { useState } from 'react';
import { 
  Phone, 
  User, 
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useScheduledCallbacks, CreateCallbackInput } from '@/hooks/useScheduledCallbacks';
import { format, addHours, addDays, setHours, setMinutes } from 'date-fns';
import { safeFormatDate } from "@/lib/safe-date";

interface ScheduleCallbackDialogProps {
  trigger?: React.ReactNode;
  defaultPhone?: string;
  defaultName?: string;
  contactId?: string;
  onScheduled?: () => void;
}

export function ScheduleCallbackDialog({
  trigger,
  defaultPhone = '',
  defaultName = '',
  contactId,
  onScheduled
}: ScheduleCallbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCallback } = useScheduledCallbacks();

  const [formData, setFormData] = useState({
    caller_name: defaultName,
    caller_phone: defaultPhone,
    scheduled_date: safeFormatDate(, 'yyyy-MM-dd'),
    scheduled_time: format(addHours(new Date(), 1), 'HH:mm'),
    notes: '',
    priority: 'normal',
    assigned_agent: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.caller_name || !formData.caller_phone) {
      return;
    }

    setIsSubmitting(true);

    const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);

    const input: CreateCallbackInput = {
      contact_id: contactId || null,
      caller_name: formData.caller_name,
      caller_phone: formData.caller_phone,
      scheduled_at: scheduledAt.toISOString(),
      notes: formData.notes || undefined,
      priority: formData.priority,
      assigned_agent: formData.assigned_agent || undefined,
      created_by: 'Agente Demo'
    };

    const result = await createCallback(input);
    setIsSubmitting(false);

    if (result) {
      setOpen(false);
      setFormData({
        caller_name: '',
        caller_phone: '',
        scheduled_date: safeFormatDate(, 'yyyy-MM-dd'),
        scheduled_time: format(addHours(new Date(), 1), 'HH:mm'),
        notes: '',
        priority: 'normal',
        assigned_agent: ''
      });
      onScheduled?.();
    }
  };

  const quickSchedule = (type: 'in1h' | 'in3h' | 'tomorrow' | 'nextWeek') => {
    let date: Date;
    
    switch (type) {
      case 'in1h':
        date = addHours(new Date(), 1);
        break;
      case 'in3h':
        date = addHours(new Date(), 3);
        break;
      case 'tomorrow':
        date = setMinutes(setHours(addDays(new Date(), 1), 10), 0);
        break;
      case 'nextWeek':
        date = setMinutes(setHours(addDays(new Date(), 7), 10), 0);
        break;
    }

    setFormData(prev => ({
      ...prev,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      scheduled_time: format(date, 'HH:mm')
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Phone className="h-4 w-4" />
            Agendar Callback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendar Callback
          </DialogTitle>
          <DialogDescription>
            Agende um retorno de ligação para o cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Schedule Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => quickSchedule('in1h')}>
              Em 1h
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => quickSchedule('in3h')}>
              Em 3h
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => quickSchedule('tomorrow')}>
              Amanhã 10h
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => quickSchedule('nextWeek')}>
              Próxima semana
            </Button>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="caller_name" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Nome
              </Label>
              <Input
                id="caller_name"
                value={formData.caller_name}
                onChange={(e) => setFormData(prev => ({ ...prev, caller_name: e.target.value }))}
                placeholder="Nome do cliente"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caller_phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Telefone
              </Label>
              <Input
                id="caller_phone"
                value={formData.caller_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, caller_phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
                required
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data
              </Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                min={safeFormatDate(, 'yyyy-MM-dd')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horário
              </Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Priority and Agent */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priority" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Prioridade
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_agent">Agente</Label>
              <Input
                id="assigned_agent"
                value={formData.assigned_agent}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_agent: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Observações
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Motivo do callback, assuntos a tratar..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Agendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
