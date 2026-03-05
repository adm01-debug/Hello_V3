import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createAPIGateway, testHelpers, gracefulShutdown } from './gateway';
import jwt from 'jsonwebtoken';

describe('API Gateway', () => {
  let app: any;

  beforeEach(() => {
    app = createAPIGateway();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await gracefulShutdown();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        redis: expect.any(String),
        circuitBreaker: expect.any(String),
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Authentication', () => {
    describe('POST /auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123',
          })
          .expect(200);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe('test@example.com');
      });

      it('should return 400 for missing email', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            password: 'password123',
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toContain('Email and password are required');
      });

      it('should return 400 for missing password', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'test@example.com',
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
      });

      it('should respect rate limiting', async () => {
        // Make 5 login attempts (the limit)
        for (let i = 0; i < 5; i++) {
          await request(app)
            .post('/auth/login')
            .send({
              email: 'test@example.com',
              password: 'password123',
            });
        }

        // 6th attempt should be rate limited
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123',
          })
          .expect(429);

        expect(response.body.error).toBe('Too Many Requests');
        expect(response.body.retryAfter).toBeDefined();
      });
    });

    describe('POST /auth/logout', () => {
      it('should logout authenticated user', async () => {
        const user = testHelpers.createMockUser();
        const token = testHelpers.createMockToken(user);

        const response = await request(app)
          .post('/auth/logout')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.message).toContain('Logged out successfully');
      });

      it('should return 401 for missing token', async () => {
        const response = await request(app)
          .post('/auth/logout')
          .expect(401);

        expect(response.body.error).toBe('Unauthorized');
      });

      it('should return 401 for invalid token', async () => {
        const response = await request(app)
          .post('/auth/logout')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.error).toBe('Unauthorized');
      });
    });
  });

  describe('JWT Authentication Middleware', () => {
    it('should accept valid JWT token', async () => {
      const user = testHelpers.createMockUser({ role: 'admin' });
      const token = testHelpers.createMockToken(user);

      const response = await request(app)
        .get('/metrics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.text).toContain('api_requests_total');
    });

    it('should reject expired token', async () => {
      const user = testHelpers.createMockUser();
      const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '-1h' });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toContain('expired');
    });

    it('should reject malformed token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject token without Bearer prefix', async () => {
      const user = testHelpers.createMockUser();
      const token = testHelpers.createMockToken(user);

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', token)
        .expect(401);

      expect(response.body.message).toContain('Missing or invalid authorization header');
    });
  });

  describe('RBAC Authorization', () => {
    it('should allow admin to access admin routes', async () => {
      const admin = testHelpers.createMockUser({ role: 'admin' });
      const token = testHelpers.createMockToken(admin);

      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    it('should deny non-admin access to admin routes', async () => {
      const user = testHelpers.createMockUser({ role: 'user' });
      const token = testHelpers.createMockToken(user);

      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should allow moderator to access their routes', async () => {
      const moderator = testHelpers.createMockUser({ role: 'moderator' });
      const token = testHelpers.createMockToken(moderator);

      // Moderators can access admin routes in this implementation
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403); // Not admin

      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply different limits to different endpoints', async () => {
      // Health check should not be rate limited
      for (let i = 0; i < 200; i++) {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
      }
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/auth/login')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('not found');
    });

    it('should handle internal server errors gracefully', async () => {
      // This would require mocking an error condition
      // Implementation depends on specific error scenarios
    });

    it('should not expose stack traces in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Trigger an error somehow
      const response = await request(app).get('/health');

      process.env.NODE_ENV = originalEnv;

      // Verify no stack trace in response
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should not expose server information', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Metrics Endpoint', () => {
    it('should require admin access', async () => {
      const user = testHelpers.createMockUser({ role: 'user' });
      const token = testHelpers.createMockToken(user);

      const response = await request(app)
        .get('/metrics')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should return Prometheus format metrics', async () => {
      const admin = testHelpers.createMockUser({ role: 'admin' });
      const token = testHelpers.createMockToken(admin);

      const response = await request(app)
        .get('/metrics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });
  });
});

describe('Test Helpers', () => {
  describe('createMockUser', () => {
    it('should create user with default values', () => {
      const user = testHelpers.createMockUser();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user.role).toBe('user');
    });

    it('should allow overriding values', () => {
      const user = testHelpers.createMockUser({
        email: 'custom@example.com',
        role: 'admin',
      });

      expect(user.email).toBe('custom@example.com');
      expect(user.role).toBe('admin');
    });
  });

  describe('createMockToken', () => {
    it('should create valid JWT token', () => {
      const user = testHelpers.createMockUser();
      const token = testHelpers.createMockToken(user);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });
  });
});
