const express = require('express');
const router = express.Router();
const {
  getStockTransfers,
  createStockTransfer,
  approveStockTransfer,
  rejectStockTransfer,
  markInTransit,
  completeStockTransfer
} = require('../controllers/stockTransfer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getStockTransfers)
  .post(protect, authorize('super_admin', 'warehouse_manager'), createStockTransfer);

router.patch('/:id/approve', protect, authorize('super_admin', 'warehouse_manager'), approveStockTransfer);
router.patch('/:id/reject', protect, authorize('super_admin', 'warehouse_manager'), rejectStockTransfer);
router.patch('/:id/in-transit', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), markInTransit);
router.patch('/:id/complete', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), completeStockTransfer);

module.exports = router;
