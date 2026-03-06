
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { KeyRound, Check, X, Clock, AlertTriangle, Shield } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface ResetRequest {
  id: string;
  user_id: string;
  user_email: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewer_email: string | null;
  rejection_reason: string | null;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export default function PasswordResetApproval() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResetRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['password-reset-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      return data as ResetRequest[];
    }
  });

  // Approve request
  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.functions.invoke('approve-password-reset', {
        body: { requestId, action: 'approve' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
      toast.success('Solicitação aprovada. O usuário receberá um email para redefinir a senha.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    }
  });

  // Reject request
  const rejectRequest = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          reviewer_email: user?.email,
          rejection_reason: reason
        })
        .eq('id', requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      toast.success('Solicitação rejeitada');
    },
    onError: () => {
      toast.error('Erro ao rejeitar solicitação');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400"><Check className="h-3 w-3 mr-1" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-400"><X className="h-3 w-3 mr-1" /> Rejeitado</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400"><Check className="h-3 w-3 mr-1" /> Concluído</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400"><AlertTriangle className="h-3 w-3 mr-1" /> Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const pendingRequests = requests.filter(r => r.status === 'pending' && !isExpired(r.expires_at));
  const processedRequests = requests.filter(r => r.status !== 'pending' || isExpired(r.expires_at));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <KeyRound className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Aprovação de Reset de Senha</h1>
          <p className="text-muted-foreground">
            Revise e aprove solicitações de redefinição de senha
          </p>
        </div>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Solicitações Pendentes ({pendingRequests.length})
          </CardTitle>
          <CardDescription>
            Solicitações aguardando aprovação de um administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.user_email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.requested_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.expires_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{request.ip_address || '-'}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveRequest.mutate(request.id)}
                        disabled={approveRequest.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedRequest(request);
                          setRejectDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
          <CardDescription>
            Solicitações já processadas ou expiradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">Nenhum histórico</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Revisado em</TableHead>
                  <TableHead>Revisor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.slice(0, 20).map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.user_email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.requested_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.reviewed_at 
                        ? new Date(request.reviewed_at).toLocaleString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>{request.reviewer_email || '-'}</TableCell>
                    <TableCell>
                      {isExpired(request.expires_at) && request.status === 'pending'
                        ? getStatusBadge('expired')
                        : getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {request.rejection_reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Rejeitar reset de senha para {selectedRequest?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da rejeição</label>
              <Textarea
                placeholder="Informe o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  rejectRequest.mutate({ 
                    requestId: selectedRequest.id, 
                    reason: rejectionReason 
                  });
                }
              }}
              disabled={rejectRequest.isPending}
            >
              Rejeitar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
