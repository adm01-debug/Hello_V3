import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, Globe, User, AlertTriangle, Clock, Network } from 'lucide-react';

import { ptBR } from 'date-fns/locale';
import { useIPWhitelist } from '@/hooks/useIPWhitelist';
import { usePageTitle } from '@/hooks/usePageTitle';
import { safeFormatDatePtBR } from "@/lib/safe-date";

export default function IPWhitelist() {
  usePageTitle('Whitelist de IPs');

  const { hasRole } = useAuthContext();
  const isAdmin = hasRole(['admin']);
  const {
    globalIPs, userRestrictions, blockedLogs, users, loading, userIPs,
    addGlobalIP, removeGlobalIP, toggleUserRestriction, fetchUserIPs, addUserIP, removeUserIP,
  } = useIPWhitelist(isAdmin);

  const [addIPDialogOpen, setAddIPDialogOpen] = useState(false);
  const [addUserIPDialogOpen, setAddUserIPDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newIP, setNewIP] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCIDR, setIsCIDR] = useState(false);

  const handleAddGlobalIP = async () => {
    const ok = await addGlobalIP(newIP, newDescription, isCIDR);
    if (ok) { setNewIP(''); setNewDescription(''); setIsCIDR(false); setAddIPDialogOpen(false); }
  };

  const handleAddUserIP = async () => {
    const ok = await addUserIP(selectedUserId, newIP, newDescription, isCIDR);
    if (ok) { setNewIP(''); setNewDescription(''); setIsCIDR(false); setAddUserIPDialogOpen(false); }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">Apenas administradores podem gerenciar a whitelist de IPs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8 text-primary" />Whitelist de IPs</h1>
          <p className="text-muted-foreground mt-1">Gerencie IPs autorizados para acesso ao sistema</p>
        </div>
      </div>

      <Tabs defaultValue="global" className="space-y-4">
        <TabsList>
          <TabsTrigger value="global" className="flex items-center gap-2"><Globe className="h-4 w-4" />IPs Globais</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2"><User className="h-4 w-4" />Restrições por Usuário</TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Acessos Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Whitelist Global</CardTitle><CardDescription>IPs que podem acessar o sistema para todos os usuários com restrição habilitada</CardDescription></div>
              <Dialog open={addIPDialogOpen} onOpenChange={setAddIPDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Adicionar IP</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar IP à Whitelist Global</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Endereço IP</Label><Input placeholder={isCIDR ? "192.168.1.0/24" : "192.168.1.100"} value={newIP} onChange={(e) => setNewIP(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Descrição (opcional)</Label><Input placeholder="Ex: Escritório principal" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} /></div>
                    <div className="flex items-center space-x-2"><Switch checked={isCIDR} onCheckedChange={setIsCIDR} /><Label>Range CIDR</Label><Badge variant="outline" className="ml-2"><Network className="h-3 w-3 mr-1" />{isCIDR ? 'Range de rede' : 'IP único'}</Badge></div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setAddIPDialogOpen(false)}>Cancelar</Button><Button onClick={handleAddGlobalIP}>Adicionar</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {globalIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Globe className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhum IP na whitelist global.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>IP / CIDR</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Adicionado em</TableHead><TableHead className="w-[80px]">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {globalIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono">{ip.ip_address}</TableCell>
                        <TableCell>{ip.description || '-'}</TableCell>
                        <TableCell><Badge variant={ip.is_cidr ? 'default' : 'secondary'}>{ip.is_cidr ? 'CIDR' : 'IP'}</Badge></TableCell>
                        <TableCell>{safeFormatDatePtBR(ip.created_at, 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeGlobalIP(ip.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>Restrições por Usuário</CardTitle><CardDescription>Habilite restrição de IP para usuários específicos</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Email</TableHead><TableHead>Restrição Ativa</TableHead><TableHead>IPs Específicos</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const restriction = userRestrictions.find(r => r.user_id === user.id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name || 'Sem nome'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Switch checked={restriction?.enabled || false} onCheckedChange={(checked) => toggleUserRestriction(user.id, checked)} /></TableCell>
                        <TableCell><Button variant="outline" size="sm" onClick={() => { setSelectedUserId(user.id); fetchUserIPs(user.id); setAddUserIPDialogOpen(true); }} disabled={!restriction?.enabled}><Plus className="h-4 w-4 mr-1" />Gerenciar IPs</Button></TableCell>
                        <TableCell>{restriction?.enabled ? <Badge variant="default" className="bg-success"><Shield className="h-3 w-3 mr-1" />Protegido</Badge> : <Badge variant="secondary">Sem restrição</Badge>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Dialog open={addUserIPDialogOpen} onOpenChange={setAddUserIPDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>IPs do Usuário: {users.find(u => u.id === selectedUserId)?.email}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Novo IP</Label><Input placeholder={isCIDR ? "192.168.1.0/24" : "192.168.1.100"} value={newIP} onChange={(e) => setNewIP(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Descrição</Label><Input placeholder="Ex: Casa" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Tipo</Label><div className="flex items-center gap-2 h-10"><Switch checked={isCIDR} onCheckedChange={setIsCIDR} /><span className="text-sm">{isCIDR ? 'CIDR' : 'IP'}</span><Button size="sm" onClick={handleAddUserIP}><Plus className="h-4 w-4" /></Button></div></div>
                </div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader><TableRow><TableHead>IP / CIDR</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead className="w-[80px]">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {userIPs.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhum IP específico.</TableCell></TableRow>
                      ) : userIPs.map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-mono">{ip.ip_address}</TableCell>
                          <TableCell>{ip.description || '-'}</TableCell>
                          <TableCell><Badge variant={ip.is_cidr ? 'default' : 'secondary'}>{ip.is_cidr ? 'CIDR' : 'IP'}</Badge></TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => removeUserIP(ip.id, selectedUserId)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Tentativas de Acesso Bloqueadas</CardTitle></CardHeader>
            <CardContent>
              {blockedLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma tentativa bloqueada.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Usuário</TableHead><TableHead>IP</TableHead><TableHead>Motivo</TableHead><TableHead>User Agent</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {blockedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{safeFormatDatePtBR(log.created_at, 'dd/MM/yyyy HH:mm:ss')}</div></TableCell>
                        <TableCell>{log.user_email || 'Desconhecido'}</TableCell>
                        <TableCell className="font-mono">{log.ip_address}</TableCell>
                        <TableCell><Badge variant="destructive">{log.reason}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{log.user_agent || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
