const express = require('express');
const router = express.Router();
const {
  getStockAdjustmentRequests,
  createStockAdjustmentRequest,
  approveStockAdjustmentRequest,
  rejectStockAdjustmentRequest
} = require('../controllers/stockAdjustment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getStockAdjustmentRequests)
  .post(protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), createStockAdjustmentRequest);

router.patch('/:id/approve', protect, authorize('super_admin', 'warehouse_manager'), approveStockAdjustmentRequest);
router.patch('/:id/reject', protect, authorize('super_admin', 'warehouse_manager'), rejectStockAdjustmentRequest);

module.exports = router;
