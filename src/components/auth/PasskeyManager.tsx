import { useState } from 'react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Fingerprint, 
  Plus, 
  Trash2, 
  Pencil, 
  Loader2,
  Smartphone,
  Monitor,
  Laptop,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import { ptBR } from 'date-fns/locale';

import { safeFormatDistanceToNow } from "@/lib/safe-date";
export function PasskeyManager() {
  const {
    passkeys,
    isLoading,
    isSupported,
    isPlatformAvailable,
    isRegistering,
    hasPasskeys,
    registerPasskey,
    removePasskey,
    renamePasskey,
  } = useWebAuthn();

  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleRegister = async () => {
    const success = await registerPasskey(newPasskeyName || undefined);
    if (success) {
      setNewPasskeyName('');
      setShowAddDialog(false);
    }
  };

  const handleRename = async (id: string) => {
    if (editName.trim()) {
      await renamePasskey(id, editName);
      setEditingId(null);
      setEditName('');
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case 'iOS':
      case 'Android':
        return <Smartphone className="h-5 w-5" />;
      case 'macOS':
        return <Laptop className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Passkeys / Login Biométrico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu navegador não suporta WebAuthn/Passkeys. 
              Use um navegador moderno como Chrome, Safari ou Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Passkeys / Login Biométrico
              {hasPasskeys && (
                <Badge variant="default" className="ml-2 bg-success text-success-foreground hover:bg-success/90">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Use Face ID, Touch ID ou Windows Hello para login sem senha
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button disabled={!isPlatformAvailable}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Passkey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Passkey</DialogTitle>
                <DialogDescription>
                  Registre uma nova passkey para login biométrico neste dispositivo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="passkey-name">Nome da Passkey (opcional)</Label>
                  <Input
                    id="passkey-name"
                    placeholder="Ex: MacBook Pessoal"
                    value={newPasskeyName}
                    onChange={(e) => setNewPasskeyName(e.target.value)}
                  />
                </div>
                <Alert>
                  <Fingerprint className="h-4 w-4" />
                  <AlertDescription>
                    Você será solicitado a usar Face ID, Touch ID ou outro método biométrico.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRegister} disabled={isRegistering}>
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Registrar Passkey
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!isPlatformAvailable && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Autenticador biométrico não detectado. Certifique-se de ter Face ID, 
              Touch ID ou Windows Hello configurado.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Fingerprint className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma passkey registrada</p>
            <p className="text-sm mt-1">
              Adicione uma passkey para fazer login sem senha
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(passkey.device_type)}
                  <div>
                    {editingId === passkey.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(passkey.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <Button size="sm" onClick={() => handleRename(passkey.id)}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">
                          {passkey.friendly_name || 'Passkey sem nome'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {passkey.device_type} • Criada{' '}
                          {safeFormatDistanceToNow(passkey.created_at, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {passkey.last_used_at && (
                            <>
                              {' '}• Último uso{' '}
                              {safeFormatDistanceToNow(passkey.last_used_at, {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {editingId !== passkey.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(passkey.id);
                        setEditName(passkey.friendly_name || '');
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Passkey</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover esta passkey? 
                            Você não poderá mais fazer login com ela.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removePasskey(passkey.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
