const StockAdjustmentRequest = require('../models/StockAdjustmentRequest');
const Product = require('../models/Product');
const { logAudit } = require('../middleware/audit.middleware');
const { sendLowStockAlert } = require('../utils/notifier');

exports.getStockAdjustmentRequests = async (req, res) => {
  try {
    const { status, warehouse, reasonCode } = req.query;
    let query = {};
    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (reasonCode) query.reasonCode = reasonCode;

    const requests = await StockAdjustmentRequest.find(query)
      .populate('product', 'name sku unit stock')
      .populate('warehouse', 'name code')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStockAdjustmentRequest = async (req, res) => {
  try {
    const { product: productId, reasonCode, quantity, note } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const qty = Number(quantity);
    if (qty < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });

    if (reasonCode !== 'count_discrepancy' && qty > product.stock.available) {
      return res.status(400).json({ success: false, message: `Cannot request an adjustment of ${qty} units — only ${product.stock.available} currently available` });
    }

    const request = await StockAdjustmentRequest.create({
      product: productId,
      warehouse: product.warehouse,
      reasonCode,
      quantity: qty,
      note,
      status: 'pending_approval',
      requestedBy: req.user._id
    });

    await logAudit({
      user: req.user,
      action: 'STOCK_ADJUSTMENT_REQUEST',
      entityType: 'StockAdjustmentRequest',
      entityId: request._id,
      newValues: request.toObject(),
      req
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveStockAdjustmentRequest = async (req, res) => {
  try {
    const request = await StockAdjustmentRequest.findById(req.params.id).populate('product');
    if (!request) return res.status(404).json({ success: false, message: 'Adjustment request not found' });
    if (request.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: `Only pending requests can be approved (currently ${request.status})` });
    }

    const product = request.product;
    const oldStock = { ...product.stock.toObject() };

    switch (request.reasonCode) {
      case 'damaged_in_transit':
      case 'expired':
        if (product.stock.available < request.quantity) {
          return res.status(400).json({ success: false, message: `Available stock has dropped below ${request.quantity}; cannot apply this adjustment` });
        }
        product.stock.available -= request.quantity;
        product.stock.damaged += request.quantity;
        break;
      case 'write_off':
        if (product.stock.available < request.quantity) {
          return res.status(400).json({ success: false, message: `Available stock has dropped below ${request.quantity}; cannot apply this adjustment` });
        }
        product.stock.available -= request.quantity;
        break;
      case 'count_discrepancy':
        product.stock.available = request.quantity;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unknown reason code' });
    }

    await product.save();
    if (product.stock.available <= product.reorderLevel) {
      sendLowStockAlert({ product, warehouseId: product.warehouse });
    }

    request.status = 'approved';
    request.approvedBy = req.user._id;
    request.appliedAt = new Date();
    await request.save();

    await logAudit({
      user: req.user,
      action: 'STOCK_ADJUSTMENT_APPROVE',
      entityType: 'StockAdjustmentRequest',
      entityId: request._id,
      oldValues: { stock: oldStock },
      newValues: { stock: product.stock, reasonCode: request.reasonCode, quantity: request.quantity },
      req
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.rejectStockAdjustmentRequest = async (req, res) => {
  try {
    const request = await StockAdjustmentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Adjustment request not found' });
    if (request.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: `Only pending requests can be rejected (currently ${request.status})` });
    }

    request.status = 'rejected';
    request.approvedBy = req.user._id;
    await request.save();

    await logAudit({
      user: req.user,
      action: 'STOCK_ADJUSTMENT_REJECT',
      entityType: 'StockAdjustmentRequest',
      entityId: request._id,
      newValues: { status: request.status },
      req
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
