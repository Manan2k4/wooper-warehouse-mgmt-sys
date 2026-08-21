const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/audit.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('super_admin', 'auditor', 'warehouse_manager'), getAuditLogs);

module.exports = router;
