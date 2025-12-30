import { beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(async () => {
  process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/hello_test';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6380';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only-min-32-chars';
  process.env.JOB_ENCRYPTION_KEY = 'test-encryption-key-32-chars!';
});

afterEach(() => {
  // Clear all mocks
});

afterAll(async () => {
  // Cleanup
});

declare global {
  var testUtils: {
    createMockUser: () => any;
    createMockRequest: () => any;
    createMockResponse: () => any;
  };
}

globalThis.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
  }),
  createMockRequest: () => ({
    headers: {},
    body: {},
    params: {},
    query: {},
  }),
  createMockResponse: () => {
    const res: any = {};
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.data = data;
      return res;
    };
    res.send = (data: any) => {
      res.body = data;
      return res;
    };
    return res;
  },
};
