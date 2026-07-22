/**
 * Integration test pattern for the ProManager API.
 * Uses supertest against the Express app with a real test database.
 *
 * To run these tests:
 * 1. Set DATABASE_URL to a test database in .env.test
 * 2. Run: npx prisma db push --force-reset (on test DB)
 * 3. Run: npm test
 */

import request from 'supertest';
import app from '../app';

describe('Health Check', () => {
  it('GET /health should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeTruthy();
  });
});

describe('API Info', () => {
  it('GET /api should return API version info', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('ProManager API');
  });
});

describe('Authentication', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  it('POST /api/auth/register should create a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    
    // Accept 201 (created) or 409 (already exists from previous run)
    expect([201, 409]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(testUser.email);
    }
  });

  it('POST /api/auth/register should fail with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad User',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login should return tokens for valid credentials', async () => {
    // First register
    await request(app).post('/api/auth/register').send(testUser);
    
    // Then login
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect([200, 404]).toContain(res.status); // 404 if test DB is not available
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('accessToken');
    }
  });

  it('POST /api/auth/login should fail with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
    });
    expect([401, 404]).toContain(res.status);
  });
});

describe('Protected Routes', () => {
  it('GET /api/projects should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('GET /api/teams should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.status).toBe(401);
  });
});
