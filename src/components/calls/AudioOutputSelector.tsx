import { Speaker } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AudioOutputDevice } from "@/hooks/useAudioOutputDevices";
import { toast } from "sonner";

interface AudioOutputSelectorProps {
  supported: boolean;
  devices: AudioOutputDevice[];
  selectedSinkId: string;
  onChange: (deviceId: string) => Promise<void>;
  disabled?: boolean;
}

export function AudioOutputSelector({
  supported,
  devices,
  selectedSinkId,
  onChange,
  disabled,
}: AudioOutputSelectorProps) {
  if (!supported) {
    return (
      <p
        className="flex items-center gap-2 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <Speaker className="h-3.5 w-3.5" />
        Seleção de saída não suportada neste navegador
      </p>
    );
  }

  const handleChange = async (value: string) => {
    try {
      await onChange(value);
    } catch {
      toast.error("Não foi possível alterar a saída de áudio");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Speaker className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <label htmlFor="audio-output-select" className="sr-only">
        Saída de áudio
      </label>
      <Select
        value={selectedSinkId}
        onValueChange={handleChange}
        disabled={disabled || devices.length === 0}
      >
        <SelectTrigger id="audio-output-select" className="h-8 text-xs">
          <SelectValue placeholder="Saída de áudio" />
        </SelectTrigger>
        <SelectContent>
          {devices.length === 0 ? (
            <SelectItem value="default">Padrão do sistema</SelectItem>
          ) : (
            devices.map((d) => (
              <SelectItem key={d.deviceId} value={d.deviceId}>
                {d.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
