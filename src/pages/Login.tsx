import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useIPValidation } from '@/hooks/useIPValidation';
import { useLoginLockout } from '@/hooks/useLoginLockout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Phone, Shield, ShieldX, Globe, Wifi, MapPin, Eye, EyeOff, Lock, Clock, Headphones, BarChart3, Users } from 'lucide-react';
import { PasskeyLogin } from '@/components/auth/PasskeyLogin';
import { isWebAuthnSupported } from '@/lib/webauthn/webauthn-utils';
import { lovable } from '@/integrations/lovable/index';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [ipInfo, setIpInfo] = useState<{
    ip: string;
    country: string;
    city: string;
    countryCode: string;
  } | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const { signIn, signOut } = useAuthContext();
  const { validateIP } = useIPValidation();
  const { 
    lockoutStatus, 
    checkLockout, 
    recordFailedAttempt, 
    recordSuccessfulLogin,
    formatRemainingTime 
  } = useLoginLockout();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutStatus?.locked && lockoutStatus.remainingSeconds) {
      setCountdown(lockoutStatus.remainingSeconds);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (email) {
              checkLockout(email);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutStatus?.locked, lockoutStatus?.remainingSeconds, email, checkLockout]);

  // Fetch user's IP address and geolocation
  useEffect(() => {
    const fetchIPInfo = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.ip) {
          setIpInfo({
            ip: data.ip,
            country: data.country_name || 'Desconhecido',
            city: data.city || 'Desconhecido',
            countryCode: data.country_code || '',
          });
        } else {
          const fallbackResponse = await fetch('https://api.ipify.org?format=json');
          const fallbackData = await fallbackResponse.json();
          setIpInfo({ ip: fallbackData.ip, country: 'Desconhecido', city: 'Desconhecido', countryCode: '' });
        }
      } catch {
        setIpInfo({ ip: 'Não detectado', country: 'Desconhecido', city: 'Desconhecido', countryCode: '' });
      } finally {
        setIpLoading(false);
      }
    };
    fetchIPInfo();
  }, []);

  // Check lockout when email changes
  useEffect(() => {
    if (email && email.includes('@')) {
      const timeoutId = setTimeout(() => { checkLockout(email); }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [email, checkLockout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentLockout = await checkLockout(email);
    if (currentLockout.locked) {
      toast.error('Conta temporariamente bloqueada', {
        description: `Tente novamente em ${formatRemainingTime(currentLockout.remainingSeconds || 60)}`,
      });
      return;
    }

    setIsLoading(true);
    setIpBlocked(false);

    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        const lockResult = await recordFailedAttempt(email, ipInfo?.ip);
        if (lockResult.locked) {
          toast.error('Conta bloqueada', {
            description: `Muitas tentativas falhas. Tente novamente em ${formatRemainingTime(lockResult.remainingSeconds || 60)}`,
            duration: 10000,
          });
        } else {
          const remainingAttempts = lockResult.remainingAttempts || (5 - lockResult.attempts);
          toast.error('Erro ao fazer login', {
            description: remainingAttempts > 0
              ? `Email ou senha incorretos. ${remainingAttempts} tentativa${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`
              : 'Email ou senha incorretos.',
          });
        }
        return;
      }

      if (data?.user) {
        const ipResult = await validateIP(data.user.id, email);
        if (!ipResult.allowed) {
          await signOut();
          setIpBlocked(true);
          try {
            await supabase.functions.invoke('notify-blocked-ip', {
              body: { ip: ipInfo?.ip || 'Não detectado', email, country: ipInfo?.country, city: ipInfo?.city, userAgent: navigator.userAgent, timestamp: new Date().toISOString() },
            });
          } catch {}
          toast.error('Acesso bloqueado', {
            description: 'Seu IP não está autorizado para acessar o sistema.',
            duration: 10000,
          });
          return;
        }
        await recordSuccessfulLogin(email, ipInfo?.ip);
      }

      toast.success('Login realizado com sucesso');
      navigate(from, { replace: true });
    } catch {
      toast.error('Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockoutStatus?.locked || countdown > 0;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-foreground/95" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-info/8" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-foreground">CallCenter Pro</h2>
              <p className="text-sm text-muted-foreground">Enterprise Suite</p>
            </div>
          </div>

          {/* Center Content */}
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary-foreground leading-tight tracking-tight">
                Gerencie seu call center com{' '}
                <span className="text-primary">inteligência</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Monitore chamadas em tempo real, otimize a performance dos agentes e tome decisões baseadas em dados.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Headphones, label: 'Monitoramento em tempo real', desc: 'Acompanhe todas as chamadas ativas' },
                { icon: BarChart3, label: 'Analytics avançados', desc: 'Relatórios e métricas detalhadas' },
                { icon: Users, label: 'Gestão de equipe', desc: 'Coaching e gamificação de agentes' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-4 p-4 rounded-xl bg-primary-foreground/[0.04] backdrop-blur-sm border border-primary-foreground/[0.06] hover:bg-primary-foreground/[0.07] transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Shield className="h-3 w-3" />
            <span>Criptografia end-to-end · SOC 2 Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center text-center lg:hidden mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary mb-3">
              <Phone className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CallCenter Pro</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de gerenciamento</p>
          </div>

          {/* Heading - Desktop */}
          <div className="hidden lg:block space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm">Entre com suas credenciais para continuar</p>
          </div>

          {/* Lockout Alert */}
          {isLocked && (
            <Alert className="border-destructive/50 bg-destructive/5">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-destructive">Conta Bloqueada</span>
                  <AlertDescription className="text-xs mt-0.5 text-destructive/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Tente novamente em <strong>{formatRemainingTime(countdown)}</strong></span>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* IP Info - Compact */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            ipBlocked 
              ? 'border-destructive/30 bg-destructive/5' 
              : 'border-border bg-muted/30'
          }`}>
            {ipBlocked ? (
              <ShieldX className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {ipLoading ? (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Detectando localização...
                </span>
              ) : ipBlocked ? (
                <span className="text-xs text-destructive">IP não autorizado ({ipInfo?.ip})</span>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{ipInfo?.ip}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ipInfo?.city !== 'Desconhecido' ? `${ipInfo?.city}, ${ipInfo?.countryCode}` : ipInfo?.country}
                  </span>
                  <Wifi className="h-3 w-3 text-success ml-auto shrink-0" />
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-hover transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 font-medium"
              disabled={isLoading || isLocked}
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
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            aria-label="Entrar com conta Google"
            className="w-full h-11 font-medium"
            disabled={isLoading}
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast.error('Erro ao entrar com Google');
              }
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </Button>

          {/* Passkey */}
          {isWebAuthnSupported() && (
            <PasskeyLogin 
              onSuccess={() => navigate(from, { replace: true })}
              showEmailField={false}
            />
          )}

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Registre-se
            </Link>
          </p>

          {/* Security footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 pt-2">
            <Shield className="h-3 w-3" />
            <span>Conexão segura · Dados criptografados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
