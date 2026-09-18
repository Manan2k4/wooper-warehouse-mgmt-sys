const Product = require('../models/Product');
const { logAudit } = require('../middleware/audit.middleware');

exports.adjustStock = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const oldStock = { ...product.stock.toObject() };
    const qty = Number(quantity);

    if (type === 'add_available') {
      product.stock.available += qty;
    } else if (type === 'reduce_available') {
      if (product.stock.available < qty) {
        return res.status(400).json({ success: false, message: 'Insufficient available stock' });
      }
      product.stock.available -= qty;
    } else if (type === 'move_to_damaged') {
      if (product.stock.available < qty) {
        return res.status(400).json({ success: false, message: 'Insufficient available stock to mark damaged' });
      }
      product.stock.available -= qty;
      product.stock.damaged += qty;
    } else if (type === 'return_to_available') {
      if (product.stock.returned < qty) {
        return res.status(400).json({ success: false, message: 'Insufficient returned stock' });
      }
      product.stock.returned -= qty;
      product.stock.available += qty;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
    }

    await product.save();

    await logAudit({
      user: req.user,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'Product',
      entityId: product._id,
      oldValues: { stock: oldStock },
      newValues: { stock: product.stock, reason, adjustmentType: type, quantity: qty },
      req
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
