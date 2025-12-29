import { createClient } from '@supabase/supabase-js';

// Validação de variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: VITE_SUPABASE_URL. ' +
    'Please check your .env file and ensure VITE_SUPABASE_URL is set.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable: VITE_SUPABASE_ANON_KEY. ' +
    'Please check your .env file and ensure VITE_SUPABASE_ANON_KEY is set.'
  );
}

// Validação de formato de URL
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(
    `Invalid VITE_SUPABASE_URL format: ${supabaseUrl}. ` +
    'Must be a valid URL (e.g., https://your-project.supabase.co)'
  );
}

// Criar cliente Supabase com configurações otimizadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'hello-auth-token',
    storage: window.localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'hello',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Health check function
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('_healthcheck').select('*').limit(1);
    return !error || error.code === 'PGRST116'; // Table not found is OK for healthcheck
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
}

// Export type-safe client
export type SupabaseClient = typeof supabase;

export default supabase;
