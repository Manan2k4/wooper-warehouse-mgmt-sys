process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_ci';

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { connectTestDB, closeTestDB, clearCollections } = require('./testDb');

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearCollections(); });
afterAll(async () => { await closeTestDB(); });

beforeEach(async () => {
  await User.create({ name: 'Test Admin', email: 'testadmin@wms.com', password: 'password123', role: 'super_admin' });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in and returns a token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testadmin@wms.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('testadmin@wms.com');
  });

  it('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testadmin@wms.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a nonexistent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@wms.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('rejects a login with missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'testadmin@wms.com' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a request with an invalid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testadmin@wms.com', password: 'password123' });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('testadmin@wms.com');
  });
});
