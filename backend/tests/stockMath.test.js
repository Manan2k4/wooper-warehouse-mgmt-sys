process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_ci';

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Warehouse = require('../src/models/Warehouse');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { connectTestDB, closeTestDB, clearCollections } = require('./testDb');

let token;
let product;

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearCollections(); });
afterAll(async () => { await closeTestDB(); });

beforeEach(async () => {
  await User.create({ name: 'Test Manager', email: 'testmanager@wms.com', password: 'password123', role: 'warehouse_manager' });
  const warehouse = await Warehouse.create({ name: 'Test Warehouse', code: 'WH-TEST-01' });
  const category = await Category.create({ name: 'Test Category', code: 'TST' });
  product = await Product.create({
    name: 'Test Widget',
    sku: 'TST-WID-0001',
    barcode: 'BC-TEST-0001',
    category: category._id,
    warehouse: warehouse._id,
    costPrice: 10,
    sellingPrice: 20,
    reorderLevel: 5,
    stock: { available: 10, reserved: 0, damaged: 0, returned: 0 }
  });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'testmanager@wms.com', password: 'password123' });
  token = loginRes.body.token;
});

describe('POST /api/v1/inventory/adjust — stock math integrity', () => {
  it('rejects reducing available stock past zero and leaves stock unchanged', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), type: 'reduce_available', quantity: 999, reason: 'over-reduce test' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient/i);

    const unchanged = await Product.findById(product._id);
    expect(unchanged.stock.available).toBe(10);
  });

  it('applies a valid reduction and decrements available correctly', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), type: 'reduce_available', quantity: 4, reason: 'valid reduction' });

    expect(res.status).toBe(200);
    expect(res.body.data.stock.available).toBe(6);
  });

  it('rejects moving more to damaged than is currently available', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), type: 'move_to_damaged', quantity: 50, reason: 'over-damage test' });

    expect(res.status).toBe(400);

    const unchanged = await Product.findById(product._id);
    expect(unchanged.stock.available).toBe(10);
    expect(unchanged.stock.damaged).toBe(0);
  });

  it('moves stock from available to damaged without losing units', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), type: 'move_to_damaged', quantity: 3, reason: 'valid damage report' });

    expect(res.status).toBe(200);
    expect(res.body.data.stock.available).toBe(7);
    expect(res.body.data.stock.damaged).toBe(3);
  });

  it('rejects an unknown adjustment type', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), type: 'not_a_real_type', quantity: 1, reason: 'bad type' });

    expect(res.status).toBe(400);
  });

  it('enforces non-negative stock at the schema level regardless of caller', async () => {
    product.stock.available = -1;
    await expect(product.save()).rejects.toThrow();
  });
});
