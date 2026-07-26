import { Bell, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRingtoneSettings } from '@/hooks/useRingtoneSettings';
import { getRingtonePreset } from '@/lib/ringtone-presets';
import { RemoteOriginNotice } from './RemoteOriginNotice';
import { DeviceNameSetting } from './DeviceNameSetting';
import { SyncHistoryList } from './SyncHistoryList';


/** Preferências de toque para chamadas recebidas (sincronizadas no perfil). */
export function RingtoneSettings() {
  const {
    presetId,
    volume,
    presets,
    selectPreset,
    changeVolume,
    preview,
    remoteUpdatedAt,
    remoteDevice,
    acknowledgeRemoteUpdate,
    resetToDefaults,
    isDefault,
    syncHistory,
    clearSyncHistory,
  } = useRingtoneSettings();

  const active = getRingtonePreset(presetId);
  const volumePercent = Math.round(volume * 100);

  return (
    <section aria-labelledby="toque-heading" className="rounded-lg border border-border/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3
          id="toque-heading"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          <Bell className="h-3.5 w-3.5" /> Toque
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
          onClick={resetToDefaults}
          disabled={isDefault}
          aria-label="Restaurar toque padrão"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" /> Padrão
        </Button>
      </div>

      <RemoteOriginNotice
        subject="Toque"
        device={remoteDevice}
        updatedAt={remoteUpdatedAt}
        onDismiss={acknowledgeRemoteUpdate}
      />




      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Select value={presetId} onValueChange={selectPreset}>
            <SelectTrigger className="h-9 flex-1" aria-label="Toque para chamadas recebidas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Ouvir prévia do toque"
            onClick={preview}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">{active.description}</p>

        <div className="space-y-1">
          <Label htmlFor="ringtone-volume" className="text-[11px] text-muted-foreground">
            Volume: {volumePercent}%
          </Label>
          <Slider
            id="ringtone-volume"
            min={0}
            max={100}
            step={5}
            value={[volumePercent]}
            onValueChange={([next]) => changeVolume((next ?? 0) / 100)}
            aria-label="Volume do toque"
          />
        </div>

        <DeviceNameSetting />
        <SyncHistoryList entries={syncHistory} onClear={clearSyncHistory} />

      </div>
    </section>

  );
}
