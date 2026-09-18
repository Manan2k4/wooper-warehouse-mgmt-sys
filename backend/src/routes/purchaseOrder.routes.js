const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  receiveItems,
  cancelPurchaseOrder
} = require('../controllers/purchaseOrder.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getPurchaseOrders)
  .post(protect, authorize('super_admin', 'warehouse_manager'), createPurchaseOrder);

router.get('/:id', protect, getPurchaseOrderById);
router.patch('/:id/receive', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), receiveItems);
router.patch('/:id/cancel', protect, authorize('super_admin', 'warehouse_manager'), cancelPurchaseOrder);

module.exports = router;
