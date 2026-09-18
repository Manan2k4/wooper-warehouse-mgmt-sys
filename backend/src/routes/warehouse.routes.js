const express = require('express');
const router = express.Router();
const { getWarehouses, createWarehouse, getLocations, createLocation } = require('../controllers/warehouse.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getWarehouses)
  .post(protect, authorize('super_admin'), createWarehouse);

router.route('/:warehouseId/locations')
  .get(protect, getLocations)
  .post(protect, authorize('super_admin', 'warehouse_manager'), createLocation);

module.exports = router;
