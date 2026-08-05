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
import { Loader2, Phone, Shield, ShieldX, Globe, Wifi, MapPin, Eye, EyeOff, Lock, Clock, Zap } from 'lucide-react';
import { PasskeyLogin } from '@/components/auth/PasskeyLogin';
import { LoginBranding } from '@/components/auth/LoginBranding';
import { isWebAuthnSupported } from '@/lib/webauthn/webauthn-utils';
import { lovable } from '@/integrations/lovable/index';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Login() {
  usePageTitle('Login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [ipInfo, setIpInfo] = useState<{ ip: string; country: string; city: string; countryCode: string } | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const { signIn, signOut, isAuthenticated, loading: authLoading } = useAuthContext();
  const { validateIP } = useIPValidation();
  const { lockoutStatus, checkLockout, recordFailedAttempt, recordSuccessfulLogin, formatRemainingTime } = useLoginLockout();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    navigate(from, { replace: true });
  }, [authLoading, isAuthenticated, navigate, from]);

  useEffect(() => {
    if (lockoutStatus?.locked && lockoutStatus.remainingSeconds) {
      setCountdown(lockoutStatus.remainingSeconds);
      const interval = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { clearInterval(interval); if (email) checkLockout(email); return 0; } return prev - 1; });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutStatus?.locked, lockoutStatus?.remainingSeconds, email, checkLockout]);

  useEffect(() => {
    const fetchIPInfo = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data?.ip) setIpInfo({ ip: data.ip, country: data.country_name || 'Desconhecido', city: data.city || 'Desconhecido', countryCode: data.country_code || '' });
        else { const fb = await fetch('https://api.ipify.org?format=json'); const fbd = await fb.json(); setIpInfo({ ip: fbd.ip, country: 'Desconhecido', city: 'Desconhecido', countryCode: '' }); }
      } catch { setIpInfo({ ip: 'Não detectado', country: 'Desconhecido', city: 'Desconhecido', countryCode: '' }); }
      finally { setIpLoading(false); }
    };
    fetchIPInfo();
  }, []);

  useEffect(() => {
    if (email && email.includes('@')) {
      const t = setTimeout(() => { checkLockout(email); }, 500);
      return () => clearTimeout(t);
    }
  }, [email, checkLockout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentLockout = await checkLockout(email);
    if (currentLockout.locked) { toast.error('Conta temporariamente bloqueada', { description: `Tente novamente em ${formatRemainingTime(currentLockout.remainingSeconds || 60)}` }); return; }
    setIsLoading(true); setIpBlocked(false);
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        const lockResult = await recordFailedAttempt(email, ipInfo?.ip);
        if (lockResult.locked) toast.error('Conta bloqueada', { description: `Muitas tentativas falhas. Tente novamente em ${formatRemainingTime(lockResult.remainingSeconds || 60)}`, duration: 10000 });
        else { const r = lockResult.remainingAttempts || (5 - lockResult.attempts); toast.error('Erro ao fazer login', { description: r > 0 ? `Email ou senha incorretos. ${r} tentativa${r > 1 ? 's' : ''} restante${r > 1 ? 's' : ''}.` : 'Email ou senha incorretos.' }); }
        return;
      }
      if (data?.user) {
        const ipResult = await validateIP();
        if (!ipResult.allowed) {
          await signOut(); setIpBlocked(true);
          try { await supabase.functions.invoke('notify-blocked-ip', { body: { ip: ipInfo?.ip || 'Não detectado', email, country: ipInfo?.country, city: ipInfo?.city, userAgent: navigator.userAgent, timestamp: new Date().toISOString() } }); } catch {
            // best-effort notification; ignore failures so blocking still proceeds
          }
          toast.error('Acesso bloqueado', { description: 'Seu IP não está autorizado para acessar o sistema.', duration: 10000 }); return;
        }
        await recordSuccessfulLogin(email, ipInfo?.ip);
      }
      toast.success('Login realizado com sucesso'); navigate(from, { replace: true });
    } catch { toast.error('Erro inesperado'); } finally { setIsLoading(false); }
  };

  const isLocked = lockoutStatus?.locked || countdown > 0;

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh-intense opacity-30 pointer-events-none" />
      <LoginBranding />

      <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }} className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center lg:hidden mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)] mb-3"><Phone className="h-7 w-7 text-primary-foreground" /></div>
            <h1 className="text-2xl font-bold tracking-tight text-display">CallCenter Pro</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de gerenciamento</p>
          </div>

          <div className="hidden lg:block space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-display">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm">Entre com suas credenciais para continuar</p>
          </div>

          {isLocked && (
            <Alert className="border-destructive/30 bg-destructive/5 shadow-[0_0_20px_hsl(var(--destructive)/0.1)]">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1"><span className="text-sm font-medium text-destructive">Conta Bloqueada</span><AlertDescription className="text-xs mt-0.5 text-destructive/80"><div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Tente novamente em <strong>{formatRemainingTime(countdown)}</strong></span></div></AlertDescription></div>
              </div>
            </Alert>
          )}

          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-300 ${ipBlocked ? 'border-destructive/30 bg-destructive/5 shadow-[0_0_15px_hsl(var(--destructive)/0.1)]' : 'border-border/50 bg-muted/20 hover:border-primary/20'}`}>
            {ipBlocked ? <ShieldX className="h-4 w-4 text-destructive shrink-0" /> : <Globe className="h-4 w-4 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              {ipLoading ? (<span className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Detectando localização...</span>)
              : ipBlocked ? (<span className="text-xs text-destructive">IP não autorizado ({ipInfo?.ip})</span>)
              : (<div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-mono text-primary/80">{ipInfo?.ip}</span><span className="text-muted-foreground/30">·</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ipInfo?.city !== 'Desconhecido' ? `${ipInfo?.city}, ${ipInfo?.countryCode}` : ipInfo?.country}</span><Wifi className="h-3 w-3 text-success ml-auto shrink-0" /></div>)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-11 bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-shadow" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-hover transition-colors">Esqueceu a senha?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="h-11 pr-10 bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-shadow" />
                <Button type="button" variant="ghost" size="icon" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)] transition-shadow" disabled={isLoading || isLocked}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>) : (<><Zap className="mr-1 h-4 w-4" />Entrar</>)}
            </Button>
          </form>

          <div className="relative"><div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground tracking-wider">ou</span></div></div>

          <Button type="button" variant="outline" aria-label="Entrar com conta Google" className="w-full h-11 font-medium border-border/50 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all" disabled={isLoading} onClick={async () => {
            setIsLoading(true);
            try { const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (result.redirected) return; if (result.error) { toast.error('Erro ao entrar com Google'); return; } toast.success('Login com Google realizado com sucesso'); } catch { toast.error('Erro ao entrar com Google'); } finally { setIsLoading(false); }
          }}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Entrar com Google
          </Button>

          {isWebAuthnSupported() && <PasskeyLogin onSuccess={() => navigate(from, { replace: true })} showEmailField={false} />}

          <p className="text-center text-sm text-muted-foreground">Não tem uma conta?{' '}<Link to="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">Registre-se</Link></p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50 pt-2"><Shield className="h-3 w-3" /><span>Conexão segura · Dados criptografados</span></div>
        </motion.div>
      </div>
    </div>
  );
}
