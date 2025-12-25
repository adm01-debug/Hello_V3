import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useIPValidation } from '@/hooks/useIPValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Phone, Shield, ShieldX, Globe, Wifi } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [detectedIP, setDetectedIP] = useState<string | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const { signIn, signOut } = useAuthContext();
  const { validateIP } = useIPValidation();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Fetch user's IP address on component mount
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setDetectedIP(data.ip);
      } catch (error) {
        console.error('Failed to fetch IP:', error);
        setDetectedIP('Não detectado');
      } finally {
        setIpLoading(false);
      }
    };
    fetchIP();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIpBlocked(false);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        toast.error('Erro ao fazer login', {
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos'
            : 'Verifique suas credenciais e tente novamente',
        });
        return;
      }

      // Validate IP after successful authentication
      if (data?.user) {
        const ipResult = await validateIP(data.user.id, email);
        
        if (!ipResult.allowed) {
          // IP not authorized - sign out and block access
          await signOut();
          setIpBlocked(true);
          toast.error('Acesso bloqueado', {
            description: 'Seu IP não está autorizado para acessar o sistema. Entre em contato com o administrador.',
            duration: 10000,
          });
          return;
        }
      }

      toast.success('Login realizado com sucesso');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Erro inesperado');
    } finally {
      setIsLoading(false);
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
          <p className="text-muted-foreground mt-2">
            Sistema de gerenciamento de call center
          </p>
        </div>

        {/* IP Detection Alert */}
        <Alert className={`${ipBlocked ? 'border-destructive bg-destructive/10' : 'border-primary/30 bg-primary/5'}`}>
          <div className="flex items-center gap-3">
            {ipBlocked ? (
              <ShieldX className="h-5 w-5 text-destructive" />
            ) : (
              <Globe className="h-5 w-5 text-primary" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {ipBlocked ? 'IP Bloqueado' : 'IP Detectado'}
                </span>
                {!ipLoading && (
                  <span className="flex items-center gap-1">
                    <Wifi className={`h-3 w-3 ${ipBlocked ? 'text-destructive' : 'text-green-500'}`} />
                    <span className={`text-xs ${ipBlocked ? 'text-destructive' : 'text-green-600'}`}>
                      {ipBlocked ? 'Não autorizado' : 'Conectado'}
                    </span>
                  </span>
                )}
              </div>
              <AlertDescription className="text-xs mt-1">
                {ipLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Detectando IP...
                  </span>
                ) : ipBlocked ? (
                  <span className="text-destructive">
                    Seu IP ({detectedIP}) não está na lista de IPs autorizados. Entre em contato com o administrador.
                  </span>
                ) : (
                  <span className="font-mono">{detectedIP}</span>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:underline font-medium"
                >
                  Registre-se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Conexão segura</span>
        </div>
      </div>
    </div>
  );
}
