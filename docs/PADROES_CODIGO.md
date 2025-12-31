# 📚 GUIA DE PADRÕES DE CÓDIGO E BOAS PRÁTICAS

> Documento de referência para novos projetos baseado no sistema Hello Contact Center

---

## 📋 ÍNDICE

1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Convenções de Nomenclatura](#convenções-de-nomenclatura)
3. [Padrões de Componentes React](#padrões-de-componentes-react)
4. [Gerenciamento de Estado](#gerenciamento-de-estado)
5. [Hooks Customizados](#hooks-customizados)
6. [Edge Functions (Backend)](#edge-functions-backend)
7. [Banco de Dados](#banco-de-dados)
8. [Segurança](#segurança)
9. [Performance](#performance)
10. [Testes](#testes)
11. [Design System](#design-system)

---

## 🏗️ ESTRUTURA DO PROJETO

### Estrutura de Diretórios Padrão

```
├── docs/                       # Documentação
├── public/                     # Assets públicos
├── src/
│   ├── __tests__/             # Testes unitários
│   │   └── security/          # Testes de segurança
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes base (shadcn)
│   │   ├── layout/            # Componentes de layout
│   │   ├── [feature]/         # Componentes por feature
│   │   └── ...
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Bibliotecas utilitárias
│   │   ├── security/          # Utilitários de segurança
│   │   ├── performance/       # Utilitários de performance
│   │   ├── validation/        # Validação de dados
│   │   └── ...
│   ├── pages/                 # Páginas da aplicação
│   ├── contexts/              # Context API
│   ├── integrations/          # Integrações externas
│   │   └── supabase/          # Cliente e tipos Supabase
│   └── utils/                 # Funções utilitárias
├── supabase/
│   ├── functions/             # Edge Functions
│   │   └── [function-name]/   # Uma função por diretório
│   └── config.toml            # Configuração do Supabase
└── k8s/                       # Configurações Kubernetes (opcional)
```

### Regras de Organização

| Tipo de Arquivo | Local | Exemplo |
|-----------------|-------|---------|
| Componente de UI base | `src/components/ui/` | `Button.tsx`, `Card.tsx` |
| Componente de feature | `src/components/[feature]/` | `src/components/calls/ActiveCallBar.tsx` |
| Página | `src/pages/` | `Dashboard.tsx`, `Login.tsx` |
| Hook customizado | `src/hooks/` | `useAuth.ts`, `useCallSession.ts` |
| Utilitário | `src/lib/[categoria]/` | `src/lib/security/rate-limiter.ts` |
| Edge Function | `supabase/functions/[name]/` | `supabase/functions/analyze-call/index.ts` |

---

## 📝 CONVENÇÕES DE NOMENCLATURA

### Arquivos e Diretórios

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `UserProfile.tsx`, `CallAnalytics.tsx` |
| Hooks | camelCase com prefixo `use` | `useAuth.ts`, `useCallSession.ts` |
| Utilitários | kebab-case | `rate-limiter.ts`, `input-sanitizer.ts` |
| Páginas | PascalCase | `Dashboard.tsx`, `Settings.tsx` |
| Edge Functions | kebab-case | `analyze-call/`, `check-alerts/` |
| Testes | mesmo nome + `.test.ts` | `rate-limiter.test.ts` |

### Código

```typescript
// ✅ CORRETO - Constantes em UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// ✅ CORRETO - Interfaces com prefixo "I" ou sufixo descritivo
interface UserProfile { ... }
interface CallSessionData { ... }
type CallStatus = 'active' | 'completed' | 'failed';

// ✅ CORRETO - Funções em camelCase
function calculateCallDuration() { ... }
async function fetchUserData() { ... }

// ✅ CORRETO - Componentes em PascalCase
function ActiveCallBar() { ... }
function UserProfileCard() { ... }

// ✅ CORRETO - Hooks com prefixo "use"
function useCallSession() { ... }
function useIPValidation() { ... }
```

---

## ⚛️ PADRÕES DE COMPONENTES REACT

### Estrutura de Componente

```typescript
// src/components/feature/ComponentName.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// 1. Definir tipos/interfaces primeiro
interface ComponentNameProps {
  title: string;
  onAction: () => void;
  isLoading?: boolean;
}

// 2. Componente principal
export function ComponentName({ 
  title, 
  onAction, 
  isLoading = false 
}: ComponentNameProps) {
  // 3. Hooks primeiro
  const { user } = useAuth();
  const [state, setState] = useState<string>('');

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependency]);

  // 5. Handlers
  const handleClick = () => {
    onAction();
  };

  // 6. Render
  return (
    <div className="p-4">
      <h2>{title}</h2>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Carregando...' : 'Ação'}
      </Button>
    </div>
  );
}
```

### Composição de Componentes

```typescript
// Componente pai agrupa lógica
function CallPanel() {
  const { session } = useCallSession();
  
  return (
    <div className="flex flex-col gap-4">
      <CallHeader session={session} />
      <CallTranscription sessionId={session.id} />
      <CallControls 
        onHold={() => session.hold()} 
        onEnd={() => session.end()} 
      />
    </div>
  );
}

// Componentes filhos são apresentacionais
function CallHeader({ session }: { session: CallSession }) {
  return (
    <div className="flex justify-between">
      <span>{session.callerName}</span>
      <span>{formatDuration(session.duration)}</span>
    </div>
  );
}
```

### Lazy Loading de Componentes

```typescript
import { lazy, Suspense } from 'react';

// Lazy load de páginas pesadas
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Reports = lazy(() => import('@/pages/Reports'));

// Uso com Suspense
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

---

## 🔄 GERENCIAMENTO DE ESTADO

### Hierarquia de Estado

1. **Estado Local (useState)** - Para dados específicos do componente
2. **Context API** - Para dados compartilhados em uma árvore
3. **React Query** - Para cache de dados do servidor
4. **Zustand** (opcional) - Para estado global complexo

### React Query para Dados do Servidor

```typescript
// src/hooks/useContacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newContact: ContactInsert) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(newContact)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
```

### Context para Estado Global

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 🪝 HOOKS CUSTOMIZADOS

### Padrão de Hook

```typescript
// src/hooks/useFeature.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFeatureOptions {
  autoFetch?: boolean;
  onError?: (error: Error) => void;
}

interface UseFeatureReturn {
  data: FeatureData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  update: (data: Partial<FeatureData>) => Promise<void>;
}

export function useFeature(
  id: string,
  options: UseFeatureOptions = {}
): UseFeatureReturn {
  const { autoFetch = true, onError } = options;
  
  const [data, setData] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setData(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [id, onError]);

  const update = useCallback(async (updates: Partial<FeatureData>) => {
    const { error } = await supabase
      .from('features')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    await refetch();
  }, [id, refetch]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return { data, loading, error, refetch, update };
}
```

### Hooks Recomendados

| Hook | Propósito | Exemplo |
|------|-----------|---------|
| `useAuth` | Autenticação | Login, logout, sessão |
| `useToast` | Notificações | Mensagens de feedback |
| `useDebounce` | Debounce de valores | Busca em tempo real |
| `useLocalStorage` | Persistência local | Preferências do usuário |
| `useMediaQuery` | Responsividade | Detectar mobile/desktop |

---

## ⚡ EDGE FUNCTIONS (BACKEND)

### Estrutura Padrão

```typescript
// supabase/functions/function-name/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1. CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 2. Handler principal
serve(async (req) => {
  // 3. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 4. Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Extrair dados da requisição
    const { data } = await req.json();

    // 6. Lógica de negócio
    const result = await processData(data);

    // 7. Log para debugging
    console.log('Function executed successfully:', { result });

    // 8. Retornar resposta
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    // 9. Tratamento de erros
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
```

### Configuração de Funções

```toml
# supabase/config.toml
project_id = "your-project-id"

# Função que requer autenticação
[functions.protected-function]
verify_jwt = true

# Função pública (webhooks, crons)
[functions.public-webhook]
verify_jwt = false
```

### Chamando Edge Functions

```typescript
// No frontend
import { supabase } from '@/integrations/supabase/client';

async function callFunction() {
  const { data, error } = await supabase.functions.invoke('function-name', {
    body: { key: 'value' }
  });
  
  if (error) throw error;
  return data;
}
```

---

## 🗄️ BANCO DE DADOS

### Padrões de Tabelas

```sql
-- Estrutura padrão de tabela
CREATE TABLE public.example_table (
  -- IDs e timestamps padrão
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Referência ao usuário (quando aplicável)
  user_id UUID REFERENCES auth.users(id),
  
  -- Campos da tabela
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Índices para performance
CREATE INDEX idx_example_table_user_id ON public.example_table(user_id);
CREATE INDEX idx_example_table_status ON public.example_table(status);
CREATE INDEX idx_example_table_created_at ON public.example_table(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_example_table_updated_at
  BEFORE UPDATE ON public.example_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem apenas seus dados
CREATE POLICY "Users can view own data" 
  ON public.example_table 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Usuários podem criar seus dados
CREATE POLICY "Users can create own data" 
  ON public.example_table 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus dados
CREATE POLICY "Users can update own data" 
  ON public.example_table 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Admins podem ver tudo
CREATE POLICY "Admins can view all" 
  ON public.example_table 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Funções de Banco de Dados

```sql
-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  );
$$;
```

---

## 🔐 SEGURANÇA

### Checklist de Segurança

- [ ] **RLS habilitado** em todas as tabelas com dados sensíveis
- [ ] **Validação de input** no frontend E backend
- [ ] **Sanitização** de dados antes de salvar
- [ ] **CORS** configurado corretamente nas Edge Functions
- [ ] **JWT** verificado em funções protegidas
- [ ] **Secrets** armazenados em variáveis de ambiente
- [ ] **Rate limiting** implementado
- [ ] **Audit logs** para ações sensíveis

### Validação de Input

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

// Schema de validação
export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255),
  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'Telefone inválido')
    .optional(),
});

// Uso
function validateContact(data: unknown) {
  const result = contactSchema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return result.data;
}
```

### Rate Limiting

```typescript
// src/lib/security/rate-limiter.ts
interface RateLimiterOptions {
  windowMs: number;  // Janela de tempo em ms
  maxRequests: number;  // Máximo de requests por janela
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    // Limpar requests antigas
    const requests = (this.requests.get(key) || [])
      .filter(time => time > windowStart);
    
    if (requests.length >= this.options.maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    requests.push(now);
    this.requests.set(key, requests);
    
    return { 
      allowed: true, 
      remaining: this.options.maxRequests - requests.length 
    };
  }
}
```

### Audit Logging

```typescript
// src/hooks/useAuditLog.ts
import { supabase } from '@/integrations/supabase/client';

export function useAuditLog() {
  const logEvent = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    await supabase.rpc('log_audit_event', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details || {}
    });
  };

  return { logEvent };
}

// Uso
const { logEvent } = useAuditLog();

// Log de visualização
await logEvent('view', 'contact', contactId);

// Log de criação
await logEvent('create', 'call_session', sessionId, { 
  callerPhone: phone 
});

// Log de exportação
await logEvent('export', 'reports', null, { 
  reportType: 'monthly',
  format: 'csv'
});
```

---

## ⚡ PERFORMANCE

### Otimizações Recomendadas

| Técnica | Quando Usar |
|---------|-------------|
| **Code Splitting** | Páginas e componentes grandes |
| **Lazy Loading** | Imagens, modais, gráficos |
| **Memoization** | Cálculos pesados, listas grandes |
| **Debounce** | Inputs de busca, resize |
| **Virtual Lists** | Listas com > 100 itens |
| **Preload/Prefetch** | Navegação previsível |

### Memoization

```typescript
import { useMemo, useCallback, memo } from 'react';

// useMemo para valores calculados
const filteredItems = useMemo(() => {
  return items.filter(item => item.status === filter);
}, [items, filter]);

// useCallback para funções
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// memo para componentes
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* render */}</div>;
});
```

### Listas Virtualizadas

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px` }}
        className="relative w-full"
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="absolute top-0 left-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ItemRow item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 TESTES

### Estrutura de Testes

```typescript
// src/__tests__/feature/component.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '@/components/feature/Component';

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should call onAction when button is clicked', () => {
    const onAction = vi.fn();
    render(<Component title="Test" onAction={onAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('should disable button when loading', () => {
    render(<Component title="Test" isLoading />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testes de Hook

```typescript
// src/__tests__/hooks/useFeature.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFeature } from '@/hooks/useFeature';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test' }, error: null }),
    }),
  },
}));

describe('useFeature', () => {
  it('should fetch data on mount', async () => {
    const { result } = renderHook(() => useFeature('1'));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual({ id: '1', name: 'Test' });
  });
});
```

---

## 🎨 DESIGN SYSTEM

### Tokens de Design

```css
/* src/index.css */
@layer base {
  :root {
    /* Cores Semânticas */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    
    /* Raios de Borda */
    --radius: 0.5rem;
    
    /* Animações */
    --transition-fast: 150ms;
    --transition-normal: 300ms;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    /* ... demais cores dark */
  }
}
```

### Uso de Tokens

```tsx
// ✅ CORRETO - Usar tokens semânticos
<div className="bg-background text-foreground">
  <Button className="bg-primary text-primary-foreground">
    Ação
  </Button>
</div>

// ❌ INCORRETO - Cores hardcoded
<div className="bg-white text-gray-900">
  <button className="bg-blue-500 text-white">
    Ação
  </button>
</div>
```

### Componentes Base (shadcn)

```typescript
// Importar componentes do shadcn
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

// Uso consistente
function Example() {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Título</h3>
      </CardHeader>
      <CardContent>
        <Input placeholder="Digite algo..." />
        <Button 
          onClick={() => toast({ title: 'Sucesso!' })}
          className="mt-4"
        >
          Enviar
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 📋 CHECKLIST PARA NOVOS PROJETOS

### Setup Inicial

- [ ] Estrutura de diretórios criada
- [ ] Supabase configurado (config.toml)
- [ ] Variáveis de ambiente definidas
- [ ] Design system configurado (tokens CSS)
- [ ] Componentes base instalados (shadcn)

### Autenticação

- [ ] AuthProvider implementado
- [ ] useAuth hook criado
- [ ] Páginas de Login/Register
- [ ] Proteção de rotas

### Banco de Dados

- [ ] Tabelas com RLS habilitado
- [ ] Policies de segurança criadas
- [ ] Funções de auditoria
- [ ] Triggers de updated_at

### Segurança

- [ ] Validação de inputs (Zod)
- [ ] Sanitização de dados
- [ ] Rate limiting
- [ ] Audit logging

### Performance

- [ ] Code splitting configurado
- [ ] Lazy loading de componentes pesados
- [ ] React Query para cache
- [ ] Índices de banco otimizados

---

*Documento de referência - Hello Contact Center*
*Versão 1.0 - Dezembro 2025*
