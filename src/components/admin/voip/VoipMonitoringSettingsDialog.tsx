import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVoipMonitoringSettings } from '@/hooks/useVoipMonitoringSettings';
import { Settings2, BarChart3, Clock } from 'lucide-react';
import { safeParseInt } from '@/lib/safe-number';

export function VoipMonitoringSettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { settings, save } = useVoipMonitoringSettings();
  const [localSettings, setLocalSettings] = useState({
    occupancy_threshold_percent: 80,
    latency_threshold_ms: 200,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        occupancy_threshold_percent: settings.occupancy_threshold_percent,
        latency_threshold_ms: settings.latency_threshold_ms,
      });
    }
  }, [settings]);

  const handleSave = () => {
    save(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> Configurações de Monitoramento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Alerta de Ocupação (%)
            </Label>
            <Input 
              type="number" 
              value={localSettings.occupancy_threshold_percent}
              onChange={e => setLocalSettings(p => ({ ...p, occupancy_threshold_percent: safeParseInt(e.target.value, { fallback: 0, min: 0, max: 100 }) }))}
            />
            <p className="text-xs text-muted-foreground">Define o limite para o alerta de capacidade crítica.</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Alerta de Latência (ms)
            </Label>
            <Input 
              type="number" 
              value={localSettings.latency_threshold_ms}
              onChange={e => setLocalSettings(p => ({ ...p, latency_threshold_ms: safeParseInt(e.target.value, { fallback: 0, min: 0, max: 10_000 }) }))}
            />
            <p className="text-xs text-muted-foreground">Define o limite para o alerta de latência alta.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
