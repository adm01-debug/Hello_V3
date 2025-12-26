import { Pact } from '@pact-foundation/pact';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

const provider = new Pact({
  consumer: 'HelloFrontend',
  provider: 'HelloAPI',
  port: 8080,
  log: './logs/pact.log',
  dir: './pacts',
  logLevel: 'info',
});

describe('API Contract Tests', () => {
  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('GET /api/calls', () => {
    it('should return list of calls', async () => {
      await provider.addInteraction({
        state: 'user has calls',
        uponReceiving: 'a request for calls',
        withRequest: {
          method: 'GET',
          path: '/api/calls',
          headers: {
            Authorization: 'Bearer token123',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: [
              {
                id: '1',
                userId: 'user123',
                status: 'completed',
                duration: 120,
                startedAt: '2024-01-01T00:00:00Z',
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
            },
          },
        },
      });

      const response = await axios.get('http://localhost:8080/api/calls', {
        headers: { Authorization: 'Bearer token123' },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(1);
      expect(response.data.data[0].id).toBe('1');
    });
  });

  describe('POST /api/calls', () => {
    it('should create a new call', async () => {
      await provider.addInteraction({
        state: 'user is authenticated',
        uponReceiving: 'a request to create a call',
        withRequest: {
          method: 'POST',
          path: '/api/calls',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          },
          body: {
            contactId: 'contact123',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: '2',
            userId: 'user123',
            contactId: 'contact123',
            status: 'active',
            startedAt: '2024-01-01T00:00:00Z',
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8080/api/calls',
        { contactId: 'contact123' },
        { headers: { Authorization: 'Bearer token123' } }
      );

      expect(response.status).toBe(201);
      expect(response.data.id).toBe('2');
      expect(response.data.status).toBe('active');
    });
  });

  describe('PUT /api/calls/:id', () => {
    it('should end a call', async () => {
      await provider.addInteraction({
        state: 'call exists',
        uponReceiving: 'a request to end a call',
        withRequest: {
          method: 'PUT',
          path: '/api/calls/1',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          },
          body: {
            status: 'completed',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: '1',
            status: 'completed',
            duration: 120,
            endedAt: '2024-01-01T00:02:00Z',
          },
        },
      });

      const response = await axios.put(
        'http://localhost:8080/api/calls/1',
        { status: 'completed' },
        { headers: { Authorization: 'Bearer token123' } }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('completed');
      expect(response.data.duration).toBe(120);
    });
  });
});
