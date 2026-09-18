const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  lookupByBarcode, 
  getCategories, 
  createCategory 
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('super_admin', 'warehouse_manager'), createProduct);

router.get('/categories', protect, getCategories);
router.post('/categories', protect, authorize('super_admin', 'warehouse_manager'), createCategory);
router.get('/barcode/:code', protect, lookupByBarcode);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('super_admin', 'warehouse_manager'), updateProduct);

module.exports = router;
