import { describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('Auth Flow Integration', () => {
  it('should complete full auth flow', async () => {
    const email = 'test@example.com';
    const password = 'TestPassword123!';
    
    const { data: signUp } = await supabase.auth.signUp({ email, password });
    expect(signUp.user).toBeDefined();
    
    const { data: signIn } = await supabase.auth.signInWithPassword({ email, password });
    expect(signIn.session).toBeDefined();
    
    const { error: signOut } = await supabase.auth.signOut();
    expect(error).toBeNull();
  });
});
