import { useState } from 'react';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'supervisor' | 'agent' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  agent_id: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

const INITIAL_STATE: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
};

export function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE);
  return { authState, setAuthState };
}
