import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw, Phone } from 'lucide-react';
import { logger } from '@/lib/logger';
import { usePageTitle } from '@/hooks/usePageTitle';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

export default function VerifyEmail() {
  usePageTitle('Verificar E-mail');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // O Supabase Auth automaticamente verifica o token via URL
      // Verificar se a sessão está ativa (significa que o email foi verificado)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('Verification error:', error);
        setStatus('error');
        return;
      }

      if (session?.user) {
        setEmail(session.user.email || null);
        
        // Verificar se o email foi confirmado
        if (session.user.email_confirmed_at) {
          setStatus('success');
          toast.success('Email verificado com sucesso!');
          
          // Redirecionar após 3 segundos
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('expired');
        }
      } else {
        // Tentar verificar via token na URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (token && type === 'email') {
          // Token presente, mas sessão não ativa - pode ser link expirado
          setStatus('expired');
        } else {
          setStatus('error');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const resendVerification = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) throw error;

      toast.success('Email reenviado!', {
        description: 'Verifique sua caixa de entrada.',
      });
    } catch (error: unknown) {
      toast.error('Erro ao reenviar email', {
        description: (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Verificando Email</h2>
              <p className="text-muted-foreground mt-1">
                Aguarde enquanto confirmamos seu email...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Email Verificado!</h2>
              <p className="text-muted-foreground mt-1">
                Sua conta foi confirmada com sucesso.
              </p>
              {email && (
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>{email}</strong>
                </p>
              )}
            </div>
            <Button asChild className="w-full">
              <Link to="/">Ir para o Dashboard</Link>
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
              <Mail className="h-8 w-8 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Link Expirado</h2>
              <p className="text-muted-foreground mt-1">
                O link de verificação expirou ou já foi utilizado.
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button 
                onClick={resendVerification}
                disabled={resending || !email}
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reenviar Email
                  </>
                )}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Voltar ao Login</Link>
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Erro na Verificação</h2>
              <p className="text-muted-foreground mt-1">
                Não foi possível verificar seu email. O link pode ser inválido.
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button asChild className="w-full">
                <Link to="/register">Criar Nova Conta</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Ir para Login</Link>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CallCenter Pro</h1>
        </div>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
