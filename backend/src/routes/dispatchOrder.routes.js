const express = require('express');
const router = express.Router();
const {
  getDispatchOrders,
  getDispatchOrderById,
  createDispatchOrder,
  recordPicking,
  recordPacking,
  dispatchOrder,
  markDelivered,
  cancelDispatchOrder
} = require('../controllers/dispatchOrder.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getDispatchOrders)
  .post(protect, authorize('super_admin', 'warehouse_manager'), createDispatchOrder);

router.get('/:id', protect, getDispatchOrderById);
router.patch('/:id/pick', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), recordPicking);
router.patch('/:id/pack', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), recordPacking);
router.patch('/:id/dispatch', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), dispatchOrder);
router.patch('/:id/deliver', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), markDelivered);
router.patch('/:id/cancel', protect, authorize('super_admin', 'warehouse_manager'), cancelDispatchOrder);

module.exports = router;
