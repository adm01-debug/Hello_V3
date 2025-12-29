import DataLoader from 'dataloader';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

// User loader with error handling
export const userLoader = new DataLoader(
  async (ids: readonly string[]) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', ids as string[]);

      if (error) {
        console.error('UserLoader error:', error);
        return ids.map(() => null);
      }

      const userMap = new Map(data?.map(u => [u.id, u]) || []);
      return ids.map(id => userMap.get(id) || null);
    } catch (error) {
      console.error('UserLoader exception:', error);
      return ids.map(() => null);
    }
  },
  {
    maxBatchSize: 100,
    cache: true,
    cacheKeyFn: (key) => key,
  }
);

// Call loader with error handling
export const callLoader = new DataLoader(
  async (ids: readonly string[]) => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .in('id', ids as string[]);

      if (error) {
        console.error('CallLoader error:', error);
        return ids.map(() => null);
      }

      const callMap = new Map(data?.map(c => [c.id, c]) || []);
      return ids.map(id => callMap.get(id) || null);
    } catch (error) {
      console.error('CallLoader exception:', error);
      return ids.map(() => null);
    }
  },
  {
    maxBatchSize: 100,
    cache: true,
  }
);

// Contact loader with error handling
export const contactLoader = new DataLoader(
  async (ids: readonly string[]) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .in('id', ids as string[]);

      if (error) {
        console.error('ContactLoader error:', error);
        return ids.map(() => null);
      }

      const contactMap = new Map(data?.map(c => [c.id, c]) || []);
      return ids.map(id => contactMap.get(id) || null);
    } catch (error) {
      console.error('ContactLoader exception:', error);
      return ids.map(() => null);
    }
  },
  {
    maxBatchSize: 100,
    cache: true,
  }
);

// Transcription loader
export const transcriptionLoader = new DataLoader(
  async (callIds: readonly string[]) => {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .in('call_id', callIds as string[]);

      if (error) {
        console.error('TranscriptionLoader error:', error);
        return callIds.map(() => []);
      }

      const transcriptionMap = new Map<string, any[]>();
      data?.forEach(t => {
        const existing = transcriptionMap.get(t.call_id) || [];
        transcriptionMap.set(t.call_id, [...existing, t]);
      });

      return callIds.map(id => transcriptionMap.get(id) || []);
    } catch (error) {
      console.error('TranscriptionLoader exception:', error);
      return callIds.map(() => []);
    }
  },
  {
    maxBatchSize: 50,
    cache: true,
  }
);

// Clear all loader caches
export function clearAllLoaders() {
  userLoader.clearAll();
  callLoader.clearAll();
  contactLoader.clearAll();
  transcriptionLoader.clearAll();
}

export default {
  userLoader,
  callLoader,
  contactLoader,
  transcriptionLoader,
  clearAllLoaders,
};
