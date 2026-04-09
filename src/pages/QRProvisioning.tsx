import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Download, Copy, Smartphone, Monitor, Phone, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { usePageTitle } from '@/hooks/usePageTitle';

interface SIPConfig {
  displayName: string;
  username: string;
  password: string;
  domain: string;
  port: string;
  transport: 'UDP' | 'TCP' | 'TLS';
  proxy: string;
  codec: string;
  srtp: boolean;
  stunServer: string;
}

function generateProvisioningURL(config: SIPConfig): string {
  const params = new URLSearchParams({
    dn: config.displayName,
    un: config.username,
    pw: config.password,
    d: config.domain,
    p: config.port,
    t: config.transport,
    ...(config.proxy && { px: config.proxy }),
    c: config.codec,
    ...(config.srtp && { srtp: '1' }),
    ...(config.stunServer && { stun: config.stunServer }),
  });
  return `sip-provision://?${params.toString()}`;
}

export default function QRProvisioning() {
  const [config, setConfig] = useState<SIPConfig>({
    displayName: '',
    username: '',
    password: '',
    domain: '',
    port: '5060',
    transport: 'UDP',
    proxy: '',
    codec: 'G.711',
    srtp: false,
    stunServer: '',
  });
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const provisioningData = generateProvisioningURL(config);

  const isValid = config.displayName && config.username && config.password && config.domain;

  const handleGenerate = () => {
  usePageTitle('QR Provisioning');

    if (!isValid) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setGenerated(true);
    toast.success('QR Code gerado com sucesso!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(provisioningData);
    setCopied(true);
    toast.success('Dados copiados!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector('#qr-code-svg svg') as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.fillRect(0, 0, 512, 512);
      ctx!.fillStyle = '#FFFFFF';
      ctx?.fillRect(0, 0, 512, 512);
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement('a');
      link.download = `qr-provisioning-${config.username}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    toast.success('QR Code baixado!');
  };

  const presets = [
    { name: 'Padrão SIP', port: '5060', transport: 'UDP' as const, srtp: false },
    { name: 'Seguro TLS', port: '5061', transport: 'TLS' as const, srtp: true },
    { name: 'TCP Padrão', port: '5060', transport: 'TCP' as const, srtp: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3">
            <QrCode className="h-8 w-8 text-primary" />
            QR Code Provisioning
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure dispositivos softphone instantaneamente via QR Code
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Smartphone className="h-3.5 w-3.5" />
          Zoiper / Linphone / Grandstream
        </Badge>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <QrCode className="h-4 w-4" />
            Gerar QR Code
          </TabsTrigger>
          <TabsTrigger value="presets" className="gap-2">
            <Phone className="h-4 w-4" />
            Presets Rápidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Config Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuração SIP</CardTitle>
                <CardDescription>Preencha os dados da conta SIP para gerar o QR Code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome de Exibição *</Label>
                    <Input
                      placeholder="Agente João"
                      value={config.displayName}
                      onChange={(e) => setConfig(p => ({ ...p, displayName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usuário SIP *</Label>
                    <Input
                      placeholder="1001"
                      value={config.username}
                      onChange={(e) => setConfig(p => ({ ...p, username: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={config.password}
                    onChange={(e) => setConfig(p => ({ ...p, password: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Domínio/Servidor *</Label>
                    <Input
                      placeholder="sip.empresa.com"
                      value={config.domain}
                      onChange={(e) => setConfig(p => ({ ...p, domain: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      placeholder="5060"
                      value={config.port}
                      onChange={(e) => setConfig(p => ({ ...p, port: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transporte</Label>
                    <Select
                      value={config.transport}
                      onValueChange={(v) => setConfig(p => ({ ...p, transport: v as SIPConfig['transport'] }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UDP">UDP</SelectItem>
                        <SelectItem value="TCP">TCP</SelectItem>
                        <SelectItem value="TLS">TLS (Seguro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Codec</Label>
                    <Select
                      value={config.codec}
                      onValueChange={(v) => setConfig(p => ({ ...p, codec: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="G.711">G.711 (PCMU/PCMA)</SelectItem>
                        <SelectItem value="G.722">G.722 (HD)</SelectItem>
                        <SelectItem value="Opus">Opus</SelectItem>
                        <SelectItem value="G.729">G.729</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Outbound Proxy (opcional)</Label>
                  <Input
                    placeholder="proxy.empresa.com"
                    value={config.proxy}
                    onChange={(e) => setConfig(p => ({ ...p, proxy: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>STUN Server (opcional)</Label>
                  <Input
                    placeholder="stun.l.google.com:19302"
                    value={config.stunServer}
                    onChange={(e) => setConfig(p => ({ ...p, stunServer: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <Label>SRTP (Criptografia de Mídia)</Label>
                  </div>
                  <Switch
                    checked={config.srtp}
                    onCheckedChange={(v) => setConfig(p => ({ ...p, srtp: v }))}
                  />
                </div>

                <Button onClick={handleGenerate} disabled={!isValid} className="w-full gap-2">
                  <QrCode className="h-4 w-4" />
                  Gerar QR Code
                </Button>
              </CardContent>
            </Card>

            {/* QR Code Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code</CardTitle>
                <CardDescription>Escaneie com o aplicativo softphone do dispositivo</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                {generated && isValid ? (
                  <>
                    <div id="qr-code-svg" className="rounded-2xl border-4 border-primary/20 bg-white p-6">
                      <QRCodeSVG
                        value={provisioningData}
                        size={240}
                        level="H"
                        includeMargin={false}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">{config.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.username}@{config.domain}:{config.port} ({config.transport})
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={handleDownloadQR} className="gap-2">
                        <Download className="h-4 w-4" />
                        Baixar PNG
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copiado!' : 'Copiar Dados'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
                    <QrCode className="h-16 w-16 opacity-20" />
                    <p className="text-sm">Preencha os dados e clique em "Gerar QR Code"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="presets">
          <div className="grid gap-4 md:grid-cols-3">
            {presets.map((preset) => (
              <Card
                key={preset.name}
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() => {
                  setConfig(p => ({
                    ...p,
                    port: preset.port,
                    transport: preset.transport,
                    srtp: preset.srtp,
                  }));
                  toast.success(`Preset "${preset.name}" aplicado`);
                }}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    {preset.srtp ? (
                      <Shield className="h-6 w-6 text-primary" />
                    ) : (
                      <Monitor className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Porta {preset.port} · {preset.transport}
                      {preset.srtp && ' · SRTP'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
