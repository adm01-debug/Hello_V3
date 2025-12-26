import DataLoader from 'dataloader';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

export const userLoader = new DataLoader(async (ids: readonly string[]) => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .in('id', ids as string[]);

  return ids.map(id => data?.find(u => u.id === id) || null);
});

export const callLoader = new DataLoader(async (ids: readonly string[]) => {
  const { data } = await supabase
    .from('calls')
    .select('*')
    .in('id', ids as string[]);

  return ids.map(id => data?.find(c => c.id === id) || null);
});

export const contactLoader = new DataLoader(async (ids: readonly string[]) => {
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .in('id', ids as string[]);

  return ids.map(id => data?.find(c => c.id === id) || null);
});
