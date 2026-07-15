import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Clock, Filter, Mail, Volume2 } from 'lucide-react';
import { categoryIcons, categoryLabels, fallbackIcon } from './constants';

interface Props {
  preferences: Record<string, unknown> | null;
  onUpdate: (prefs: Record<string, unknown>) => void;
}

export function PreferencesPanel({ preferences, onUpdate }: Props) {
  const emailEnabled = (preferences?.email_enabled as boolean) ?? true;
  const pushEnabled = (preferences?.push_enabled as boolean) ?? true;
  const soundEnabled = (preferences?.sound_enabled as boolean) ?? true;
  const digestEnabled = (preferences?.digest_enabled as boolean) ?? false;
  const digestFrequency = (preferences?.digest_frequency as string) ?? 'daily';
  const quietHoursEnabled = (preferences?.quiet_hours_enabled as boolean) ?? false;
  const quietHoursStart = (preferences?.quiet_hours_start as string) ?? '22:00';
  const quietHoursEnd = (preferences?.quiet_hours_end as string) ?? '08:00';
  const categories = (preferences?.categories as Record<string, boolean>) ?? {
    system: true,
    call: true,
    security: true,
    coaching: true,
    gamification: true,
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Canais de Entrega
          </CardTitle>
          <CardDescription>Escolha como receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> E-mail
            </Label>
            <Switch
              checked={emailEnabled}
              onCheckedChange={(v) => onUpdate({ email_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Push (Navegador)
            </Label>
            <Switch
              checked={pushEnabled}
              onCheckedChange={(v) => onUpdate({ push_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" /> Som
            </Label>
            <Switch
              checked={soundEnabled}
              onCheckedChange={(v) => onUpdate({ sound_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Horário Silencioso
          </CardTitle>
          <CardDescription>Desative notificações em determinados horários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar horário silencioso</Label>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={(v) => onUpdate({ quiet_hours_enabled: v })}
            />
          </div>
          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Início</Label>
                <Input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => onUpdate({ quiet_hours_start: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fim</Label>
                <Input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => onUpdate({ quiet_hours_end: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Resumo por E-mail
          </CardTitle>
          <CardDescription>Receba um digest periódico por e-mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar digest</Label>
            <Switch
              checked={digestEnabled}
              onCheckedChange={(v) => onUpdate({ digest_enabled: v })}
            />
          </div>
          {digestEnabled && (
            <div className="space-y-1">
              <Label className="text-xs">Frequência</Label>
              <Select
                value={digestFrequency}
                onValueChange={(v) => onUpdate({ digest_frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Categorias
          </CardTitle>
          <CardDescription>Selecione quais categorias deseja receber</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const CatIcon = categoryIcons[key] ?? fallbackIcon;
            return (
              <div key={key} className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <CatIcon className="h-4 w-4" /> {label}
                </Label>
                <Switch
                  checked={categories[key] !== false}
                  onCheckedChange={(v) =>
                    onUpdate({ categories: { ...categories, [key]: v } })
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
