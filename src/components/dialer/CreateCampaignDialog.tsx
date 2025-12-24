import { useState } from 'react';
import { 
  Phone, 
  Plus,
  Loader2,
  Clock,
  Settings2
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
import { usePredictiveDialer, CreateCampaignInput } from '@/hooks/usePredictiveDialer';

interface CreateCampaignDialogProps {
  trigger?: React.ReactNode;
}

export function CreateCampaignDialog({ trigger }: CreateCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCampaign } = usePredictiveDialer();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 'predictive',
    max_concurrent_calls: 3,
    call_timeout_seconds: 30,
    retry_attempts: 2,
    retry_delay_minutes: 30,
    working_hours_start: '08:00',
    working_hours_end: '18:00'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) return;

    setIsSubmitting(true);

    const input: CreateCampaignInput = {
      name: formData.name,
      description: formData.description || undefined,
      mode: formData.mode,
      max_concurrent_calls: formData.max_concurrent_calls,
      call_timeout_seconds: formData.call_timeout_seconds,
      retry_attempts: formData.retry_attempts,
      retry_delay_minutes: formData.retry_delay_minutes,
      working_hours_start: formData.working_hours_start + ':00',
      working_hours_end: formData.working_hours_end + ':00',
      created_by: 'Agente Demo'
    };

    const result = await createCampaign(input);
    setIsSubmitting(false);

    if (result) {
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        mode: 'predictive',
        max_concurrent_calls: 3,
        call_timeout_seconds: 30,
        retry_attempts: 2,
        retry_delay_minutes: 30,
        working_hours_start: '08:00',
        working_hours_end: '18:00'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Criar Campanha de Discagem
          </DialogTitle>
          <DialogDescription>
            Configure uma nova campanha de discagem preditiva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Prospecção Q4 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Objetivo e detalhes da campanha..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mode" className="flex items-center gap-1">
                <Settings2 className="h-3 w-3" />
                Modo de Discagem
              </Label>
              <Select
                value={formData.mode}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mode: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="predictive">Preditivo</SelectItem>
                  <SelectItem value="progressive">Progressivo</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_concurrent_calls">Chamadas Simultâneas</Label>
              <Input
                id="max_concurrent_calls"
                type="number"
                min={1}
                max={10}
                value={formData.max_concurrent_calls}
                onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent_calls: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="call_timeout_seconds">Timeout (segundos)</Label>
              <Input
                id="call_timeout_seconds"
                type="number"
                min={10}
                max={120}
                value={formData.call_timeout_seconds}
                onChange={(e) => setFormData(prev => ({ ...prev, call_timeout_seconds: parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry_attempts">Tentativas de Rediscagem</Label>
              <Input
                id="retry_attempts"
                type="number"
                min={0}
                max={5}
                value={formData.retry_attempts}
                onChange={(e) => setFormData(prev => ({ ...prev, retry_attempts: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Horário de Funcionamento
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={formData.working_hours_start}
                onChange={(e) => setFormData(prev => ({ ...prev, working_hours_start: e.target.value }))}
                className="flex-1"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="time"
                value={formData.working_hours_end}
                onChange={(e) => setFormData(prev => ({ ...prev, working_hours_end: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Criar Campanha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
