import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Phone, 
  Clock, 
  FileText,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useDNCCompliance } from '@/hooks/useDNCCompliance';

export function ComplianceSettings() {
  const { settings, isLoadingSettings, getSettingValue, updateSetting } = useDNCCompliance();

  const handleToggleSetting = (key: string) => {
    const currentValue = getSettingValue(key, false);
    updateSetting({ key, value: !currentValue });
  };

  const handleNumberSetting = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      updateSetting({ key, value: numValue });
    }
  };

  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Compliance
          </CardTitle>
          <CardDescription>
            Configure as regras de conformidade para discagem automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* DNC Enabled */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Verificação DNC</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Verificar lista DNC antes de cada discagem
              </p>
            </div>
            <Switch
              checked={getSettingValue('dnc_enabled', true)}
              onCheckedChange={() => handleToggleSetting('dnc_enabled')}
            />
          </div>

          {/* Calling Hours Enabled */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Restrição de Horários</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Respeitar horários permitidos por região
              </p>
            </div>
            <Switch
              checked={getSettingValue('calling_hours_enabled', true)}
              onCheckedChange={() => handleToggleSetting('calling_hours_enabled')}
            />
          </div>

          {/* LGPD Consent Required */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Consentimento LGPD</Label>
                <Badge variant="outline" className="text-xs">LGPD</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Exigir consentimento para campanhas de marketing
              </p>
            </div>
            <Switch
              checked={getSettingValue('lgpd_consent_required', true)}
              onCheckedChange={() => handleToggleSetting('lgpd_consent_required')}
            />
          </div>

          {/* Auto Add Complaint to DNC */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Auto-Bloqueio por Reclamação</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Adicionar automaticamente à lista DNC quando houver reclamação
              </p>
            </div>
            <Switch
              checked={getSettingValue('auto_add_complaint_to_dnc', true)}
              onCheckedChange={() => handleToggleSetting('auto_add_complaint_to_dnc')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Limites de Tentativas
          </CardTitle>
          <CardDescription>
            Configure os limites de tentativas de contato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max Attempts Per Day */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">Tentativas por Dia</Label>
              <p className="text-sm text-muted-foreground">
                Máximo de tentativas por número em um dia
              </p>
            </div>
            <div className="w-24">
              <Input
                type="number"
                min={1}
                max={10}
                value={getSettingValue('max_attempts_per_day', 3)}
                onChange={(e) => handleNumberSetting('max_attempts_per_day', e.target.value)}
                className="text-center"
              />
            </div>
          </div>

          {/* Min Interval Between Calls */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">Intervalo Mínimo (minutos)</Label>
              <p className="text-sm text-muted-foreground">
                Tempo mínimo entre ligações para o mesmo número
              </p>
            </div>
            <div className="w-24">
              <Input
                type="number"
                min={15}
                max={480}
                value={getSettingValue('min_interval_between_calls', 60)}
                onChange={(e) => handleNumberSetting('min_interval_between_calls', e.target.value)}
                className="text-center"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status de Conformidade</CardTitle>
          <CardDescription>
            Visão geral do status de compliance do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">✓</p>
              <p className="text-sm text-muted-foreground">DNC Ativo</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">✓</p>
              <p className="text-sm text-muted-foreground">Horários Configurados</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">✓</p>
              <p className="text-sm text-muted-foreground">LGPD Habilitado</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">✓</p>
              <p className="text-sm text-muted-foreground">Rate Limit Ativo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
