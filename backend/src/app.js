const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

// Mount API routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/warehouses', require('./routes/warehouse.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/inventory', require('./routes/inventory.routes'));
app.use('/api/v1/purchase-orders', require('./routes/purchaseOrder.routes'));
app.use('/api/v1/dispatch-orders', require('./routes/dispatchOrder.routes'));
app.use('/api/v1/stock-transfers', require('./routes/stockTransfer.routes'));
app.use('/api/v1/stock-adjustments', require('./routes/stockAdjustment.routes'));
app.use('/api/v1/reports', require('./routes/report.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
app.use('/api/v1/audit', require('./routes/audit.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

app.use(errorHandler);

module.exports = app;
