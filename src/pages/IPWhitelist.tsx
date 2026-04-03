
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Plus, Trash2, Globe, User, AlertTriangle, Clock, Network } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IPEntry {
  id: string;
  ip_address: string;
  description: string | null;
  is_cidr: boolean;
  created_at: string;
  created_by?: string | null;
}

interface UserRestriction {
  id: string;
  user_id: string;
  enabled: boolean;
  user_email?: string;
  user_name?: string | null;
}

interface BlockedLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  ip_address: string;
  reason: string;
  user_agent: string | null;
  created_at: string;
}

export default function IPWhitelist() {
  const { hasRole } = useAuthContext();
  const [globalIPs, setGlobalIPs] = useState<IPEntry[]>([]);
  const [userRestrictions, setUserRestrictions] = useState<UserRestriction[]>([]);
  const [blockedLogs, setBlockedLogs] = useState<BlockedLog[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [addIPDialogOpen, setAddIPDialogOpen] = useState(false);
  const [addUserIPDialogOpen, setAddUserIPDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userIPs, setUserIPs] = useState<IPEntry[]>([]);
  
  // Form states
  const [newIP, setNewIP] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCIDR, setIsCIDR] = useState(false);

  const isAdmin = hasRole(['admin']);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch global IPs
      const { data: ips } = await supabase
        .from('ip_whitelist')
        .select('*')
        .order('created_at', { ascending: false });
      setGlobalIPs(ips || []);

      // Fetch users
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('id, email, full_name');
      setUsers(userProfiles || []);

      // Fetch user restrictions
      const { data: restrictions } = await supabase
        .from('user_ip_restrictions')
        .select('*');
      
      // Map user info to restrictions
      const mappedRestrictions = (restrictions || []).map(r => {
        const user = userProfiles?.find(u => u.id === r.user_id);
        return {
          ...r,
          user_email: user?.email,
          user_name: user?.full_name
        };
      });
      setUserRestrictions(mappedRestrictions);

      // Fetch blocked logs
      const { data: logs } = await supabase
        .from('blocked_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setBlockedLogs(logs || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const validateIP = (ip: string, isCidr: boolean): boolean => {
    if (isCidr) {
      // CIDR format: 192.168.1.0/24
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      return cidrRegex.test(ip);
    } else {
      // Simple IP: 192.168.1.100
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipRegex.test(ip);
    }
  };

  const addGlobalIP = async () => {
    if (!newIP.trim()) {
      toast.error('IP é obrigatório');
      return;
    }

    if (!validateIP(newIP, isCIDR)) {
      toast.error(isCIDR ? 'Formato CIDR inválido (ex: 192.168.1.0/24)' : 'Formato de IP inválido (ex: 192.168.1.100)');
      return;
    }

    try {
      const { error } = await supabase
        .from('ip_whitelist')
        .insert({
          ip_address: newIP.trim(),
          description: newDescription.trim() || null,
          is_cidr: isCIDR,
          created_by: 'admin'
        });

      if (error) throw error;

      toast.success('IP adicionado à whitelist global');
      setNewIP('');
      setNewDescription('');
      setIsCIDR(false);
      setAddIPDialogOpen(false);
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Este IP já está na whitelist');
      } else {
        toast.error('Erro ao adicionar IP');
      }
    }
  };

  const removeGlobalIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ip_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('IP removido da whitelist');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover IP');
    }
  };

  const toggleUserRestriction = async (userId: string, enabled: boolean) => {
    try {
      const existing = userRestrictions.find(r => r.user_id === userId);
      
      if (existing) {
        const { error } = await supabase
          .from('user_ip_restrictions')
          .update({ enabled })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_ip_restrictions')
          .insert({ user_id: userId, enabled });
        if (error) throw error;
      }

      toast.success(enabled ? 'Restrição de IP habilitada' : 'Restrição de IP desabilitada');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar restrição');
    }
  };

  const fetchUserIPs = async (userId: string) => {
    const { data } = await supabase
      .from('user_allowed_ips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setUserIPs(data || []);
  };

  const addUserIP = async () => {
    if (!selectedUserId || !newIP.trim()) {
      toast.error('Usuário e IP são obrigatórios');
      return;
    }

    if (!validateIP(newIP, isCIDR)) {
      toast.error(isCIDR ? 'Formato CIDR inválido' : 'Formato de IP inválido');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_allowed_ips')
        .insert({
          user_id: selectedUserId,
          ip_address: newIP.trim(),
          description: newDescription.trim() || null,
          is_cidr: isCIDR
        });

      if (error) throw error;

      toast.success('IP adicionado para o usuário');
      setNewIP('');
      setNewDescription('');
      setIsCIDR(false);
      setAddUserIPDialogOpen(false);
      fetchUserIPs(selectedUserId);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Este IP já está configurado para este usuário');
      } else {
        toast.error('Erro ao adicionar IP');
      }
    }
  };

  const removeUserIP = async (id: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('user_allowed_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('IP removido');
      fetchUserIPs(userId);
    } catch (error) {
      toast.error('Erro ao remover IP');
    }
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Whitelist de IPs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie IPs autorizados para acesso ao sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="global" className="space-y-4">
        <TabsList>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            IPs Globais
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Restrições por Usuário
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Acessos Bloqueados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Whitelist Global</CardTitle>
                <CardDescription>
                  IPs que podem acessar o sistema para todos os usuários com restrição habilitada
                </CardDescription>
              </div>
              <Dialog open={addIPDialogOpen} onOpenChange={setAddIPDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar IP
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar IP à Whitelist Global</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Endereço IP</Label>
                      <Input
                        placeholder={isCIDR ? "192.168.1.0/24" : "192.168.1.100"}
                        value={newIP}
                        onChange={(e) => setNewIP(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Input
                        placeholder="Ex: Escritório principal"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isCIDR}
                        onCheckedChange={setIsCIDR}
                      />
                      <Label>Range CIDR</Label>
                      <Badge variant="outline" className="ml-2">
                        <Network className="h-3 w-3 mr-1" />
                        {isCIDR ? 'Range de rede' : 'IP único'}
                      </Badge>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddIPDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addGlobalIP}>
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {globalIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum IP na whitelist global.</p>
                  <p className="text-sm mt-1">Usuários sem restrição habilitada poderão acessar de qualquer IP.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP / CIDR</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono">{ip.ip_address}</TableCell>
                        <TableCell>{ip.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={ip.is_cidr ? 'default' : 'secondary'}>
                            {ip.is_cidr ? 'CIDR' : 'IP'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(ip.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGlobalIP(ip.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Restrições por Usuário</CardTitle>
                <CardDescription>
                  Habilite restrição de IP para usuários específicos e configure IPs permitidos
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Restrição Ativa</TableHead>
                    <TableHead>IPs Específicos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const restriction = userRestrictions.find(r => r.user_id === user.id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name || 'Sem nome'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Switch
                            checked={restriction?.enabled || false}
                            onCheckedChange={(checked) => toggleUserRestriction(user.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              fetchUserIPs(user.id);
                              setAddUserIPDialogOpen(true);
                            }}
                            disabled={!restriction?.enabled}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Gerenciar IPs
                          </Button>
                        </TableCell>
                        <TableCell>
                          {restriction?.enabled ? (
                            <Badge variant="default" className="bg-success">
                              <Shield className="h-3 w-3 mr-1" />
                              Protegido
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Sem restrição
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={addUserIPDialogOpen} onOpenChange={setAddUserIPDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  IPs do Usuário: {users.find(u => u.id === selectedUserId)?.email}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Novo IP</Label>
                    <Input
                      placeholder={isCIDR ? "192.168.1.0/24" : "192.168.1.100"}
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Ex: Casa"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={isCIDR} onCheckedChange={setIsCIDR} />
                      <span className="text-sm">{isCIDR ? 'CIDR' : 'IP'}</span>
                      <Button size="sm" onClick={addUserIP}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP / CIDR</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userIPs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                            Nenhum IP específico. Apenas IPs da whitelist global serão permitidos.
                          </TableCell>
                        </TableRow>
                      ) : (
                        userIPs.map((ip) => (
                          <TableRow key={ip.id}>
                            <TableCell className="font-mono">{ip.ip_address}</TableCell>
                            <TableCell>{ip.description || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={ip.is_cidr ? 'default' : 'secondary'}>
                                {ip.is_cidr ? 'CIDR' : 'IP'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeUserIP(ip.id, selectedUserId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Tentativas de Acesso Bloqueadas
              </CardTitle>
              <CardDescription>
                Registro de acessos negados por restrição de IP
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tentativa de acesso bloqueada registrada.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>{log.user_email || 'Desconhecido'}</TableCell>
                        <TableCell className="font-mono">{log.ip_address}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{log.reason}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {log.user_agent || '-'}
                        </TableCell>
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