import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Phone, Shield, Eye, EyeOff, Zap } from 'lucide-react';
import { PasswordStrength, usePasswordStrength } from '@/components/auth/PasswordStrength';
import { motion } from 'framer-motion';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuthContext();
  const navigate = useNavigate();
  
  const passwordStrength = usePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!passwordStrength.isValid) {
      toast.error('A senha não atende aos requisitos mínimos de segurança');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        toast.error('Erro ao criar conta', {
          description: error.message,
        });
      } else {
        toast.success('Conta criada com sucesso!', {
          description: 'Você já pode fazer login.',
        });
        navigate('/login');
      }
    } catch (err) {
      toast.error('Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Neon ambient background */}
      <div className="absolute inset-0 gradient-mesh-intense opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[hsl(280,80%,60%)]/8 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md space-y-8 relative"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 mb-4 shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-display">CallCenter Pro</h1>
          <p className="text-muted-foreground mt-2">
            Crie sua conta para acessar o sistema
          </p>
        </div>

        <Card className="border-border/30 shadow-[0_0_40px_hsl(var(--primary)/0.08)] bg-card/80 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-display">Criar Conta</CardTitle>
            <CardDescription>
              Preencha os dados para registrar-se no sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-shadow"
                />
              </div>
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
                  className="bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-shadow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-shadow"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`bg-muted/30 border-border/50 focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-shadow ${confirmPassword && password !== confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive">As senhas não coincidem</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)] transition-shadow" 
                disabled={isLoading || !passwordStrength.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <Zap className="mr-1 h-4 w-4" />
                    Criar Conta
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  Faça login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <Shield className="h-3 w-3" />
          <span>Conexão segura · Dados criptografados</span>
        </div>
      </motion.div>
    </div>
  );
}
