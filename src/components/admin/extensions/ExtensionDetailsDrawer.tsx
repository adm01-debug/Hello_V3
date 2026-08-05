import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Smartphone, Network, QrCode, ExternalLink, Copy, UserCog, PhoneCall, History } from 'lucide-react';
import { toast } from 'sonner';

import { ptBR } from 'date-fns/locale';
import { ExtensionStatusBadge, TrunkHealthBadge } from './ExtensionStatusBadge';
import { ExtensionAuditTimeline } from './ExtensionAuditTimeline';
import type { ExtensionOverview } from '@/hooks/useExtensionsOverview';

import { safeFormatDistanceToNow } from "@/lib/safe-date";
interface Props {
  extension: ExtensionOverview | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ExtensionDetailsDrawer({ extension, open, onOpenChange }: Props) {
  const navigate = useNavigate();

  if (!extension) return null;

  const copySip = () => {
    const sip = `sip:${extension.extension}@${extension.primary_trunk_name ?? 'pbx.local'}`;
    navigator.clipboard.writeText(sip);
    toast.success('Credencial SIP copiada');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-display">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold">
              {extension.extension}
            </span>
            <div className="flex flex-col">
              <span>{extension.name}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {extension.user_full_name ?? extension.email ?? 'Sem perfil vinculado'}
              </span>
            </div>
          </SheetTitle>
          <SheetDescription>Visão 360° do ramal e ações administrativas</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center gap-2">
          <ExtensionStatusBadge status={extension.status} />
          {extension.user_role && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              {extension.user_role}
            </span>
          )}
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Geral</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="trunk">Trunk</TabsTrigger>
            <TabsTrigger value="provisioning">QR</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            <Card><CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Ramal</span><span className="font-mono font-bold">{extension.extension}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Departamento</span><span>{extension.department ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span>{extension.email ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dispositivos extras</span><span className="font-bold">{extension.device_count}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Trunk primário</span><span>{extension.primary_trunk_name ?? '—'}</span></div>
            </CardContent></Card>

            <Card className="border-primary/30">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-primary" /> Atividade (últimos 7 dias)
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-xl font-bold text-primary">{extension.call_count_7d}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Chamadas</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-xl font-bold">{Math.round(extension.avg_duration_seconds / 60)}min</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duração média</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-xs font-semibold pt-1">
                      {extension.last_call_at
                        ? safeFormatDistanceToNow(extension.last_call_at, { addSuffix: true, locale: ptBR })
                        : '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Última</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/calls?agent=${encodeURIComponent(extension.name)}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Ver chamadas
                </Button>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => navigate('/admin/users')}>
              <UserCog className="h-4 w-4 mr-2" /> Editar perfil do agente
            </Button>
          </TabsContent>

          <TabsContent value="devices" className="space-y-3 mt-4">
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{extension.device_count} dispositivo(s) ativo(s)</p>
                  <p className="text-xs text-muted-foreground">Ramal toca em todos conforme estratégia configurada</p>
                </div>
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <Button className="w-full" variant="outline" onClick={() => navigate('/multi-device-ring')}>
                <ExternalLink className="h-4 w-4 mr-2" /> Configurar Multi-Device Ring
              </Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="trunk" className="space-y-3 mt-4">
            <Card><CardContent className="pt-4 space-y-3">
              {extension.primary_trunk_name ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <Network className="h-4 w-4 text-primary" /> {extension.primary_trunk_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{extension.primary_trunk_provider}</p>
                    </div>
                    <TrunkHealthBadge health={extension.primary_trunk_health} />
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/admin/voip-trunks')}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Trocar trunk
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={copySip}>
                    <Copy className="h-4 w-4 mr-2" /> Copiar credencial SIP
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-warning">Nenhum trunk atribuído</p>
                  <Button className="w-full" onClick={() => navigate('/admin/voip-trunks')}>
                    <Phone className="h-4 w-4 mr-2" /> Atribuir trunk
                  </Button>
                </>
              )}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="provisioning" className="space-y-3 mt-4">
            <Card><CardContent className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Gere QR Code para configurar este ramal em softphones externos (Zoiper, Linphone, Bria) automaticamente.
              </p>
              <Button className="w-full" onClick={() => navigate(`/qr-provisioning?ext=${extension.extension}`)}>
                <QrCode className="h-4 w-4 mr-2" /> Gerar QR Code
              </Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            <Card><CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Últimas 20 ações registradas</p>
              </div>
              <ExtensionAuditTimeline agentId={extension.agent_id} />
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
