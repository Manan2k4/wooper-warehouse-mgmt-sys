const express = require('express');
const router = express.Router();
const {
  getStockValuationReport,
  getVelocityReport,
  getExpiryReport,
  exportInventoryCsv,
  exportInventoryExcel,
  exportValuationPdf
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/valuation', protect, getStockValuationReport);
router.get('/velocity', protect, getVelocityReport);
router.get('/expiry', protect, getExpiryReport);
router.get('/export/inventory.csv', protect, exportInventoryCsv);
router.get('/export/inventory.xlsx', protect, exportInventoryExcel);
router.get('/export/valuation.pdf', protect, exportValuationPdf);

module.exports = router;
