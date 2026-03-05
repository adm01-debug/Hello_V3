import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'admin' | 'supervisor' | 'agent' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  agent_id: string | null;
}

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth as any}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
