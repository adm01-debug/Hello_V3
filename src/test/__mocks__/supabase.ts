import { vi } from 'vitest';

// Chainable query builder mock
function createQueryBuilder() {
  const builder: Record<string, unknown> & {
    _data: unknown;
    _error: unknown;
  } = {
    _data: null,
    _error: null,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: builder._data, error: builder._error })),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: builder._data, error: builder._error })),
    then: undefined, // make it thenable via mock
  };

  // Default resolution
  const defaultResolve = () => Promise.resolve({ data: builder._data ?? [], error: builder._error, count: 0 });
  
  // Override then so await works
  builder.then = (
    resolve: (value: unknown) => unknown,
    reject: (reason: unknown) => unknown,
  ) => defaultResolve().then(resolve, reject);

  return builder;
}

export const mockQueryBuilder = createQueryBuilder();

export const mockSupabase = {
  from: vi.fn(() => createQueryBuilder()),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    refreshSession: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    mfa: {
      challenge: vi.fn().mockResolvedValue({ data: { id: 'challenge-id' }, error: null }),
      verify: vi.fn().mockResolvedValue({ error: null }),
    },
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })),
  removeChannel: vi.fn(),
};

export default mockSupabase;
