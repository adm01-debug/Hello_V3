import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle, Phone, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido').max(255, 'Email muito longo');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }
    
    setIsLoading(true);

    try {
      // Use the approval-based reset flow
      const { data, error: fnError } = await supabase.functions.invoke('request-password-reset', {
        body: { email: email.trim().toLowerCase() }
      });

      if (fnError) {
        console.error('Password reset request error:', fnError);
        toast.error('Erro ao solicitar redefinição');
        return;
      }

      setRequestSent(true);
      toast.success('Solicitação enviada', {
        description: data.message,
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Erro inesperado', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (requestSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Solicitação Enviada!</h1>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Sua solicitação de redefinição de senha foi enviada para aprovação.
            </p>
          </div>

          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Um administrador irá revisar sua solicitação. Após a aprovação, você receberá um email com instruções para redefinir sua senha.
                </AlertDescription>
              </Alert>
              
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Por que precisa de aprovação?</p>
                <p>Para sua segurança, todas as solicitações de redefinição de senha são revisadas manualmente por um administrador antes de serem processadas.</p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setRequestSent(false);
                    setEmail('');
                  }}
                >
                  Tentar outro email
                </Button>
                
                <Button asChild className="w-full">
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Esqueci Minha Senha</h1>
          <p className="text-muted-foreground mt-2">
            Solicite a redefinição da sua senha
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Recuperar Senha</CardTitle>
            <CardDescription>
              Sua solicitação será enviada para aprovação de um administrador
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Alert className="border-yellow-500/30 bg-yellow-500/5">
                <ShieldCheck className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-warning-foreground">
                  Por segurança, redefinições de senha requerem aprovação de um administrador.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  maxLength={255}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Solicitar Redefinição
                  </>
                )}
              </Button>
              
              <Link 
                to="/login" 
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar ao Login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
