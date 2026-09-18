const express = require('express');
const router = express.Router();
const { adjustStock } = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/adjust', protect, authorize('super_admin', 'warehouse_manager', 'warehouse_staff'), adjustStock);

module.exports = router;
