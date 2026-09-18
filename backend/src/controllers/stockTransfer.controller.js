const StockTransfer = require('../models/StockTransfer');
const Product = require('../models/Product');
const Location = require('../models/Location');
const { logAudit } = require('../middleware/audit.middleware');

exports.getStockTransfers = async (req, res) => {
  try {
    const { status, warehouse } = req.query;
    let query = {};
    if (status) query.status = status;
    if (warehouse) query.$or = [{ sourceWarehouse: warehouse }, { destinationWarehouse: warehouse }];

    const transfers = await StockTransfer.find(query)
      .populate('product', 'name sku unit')
      .populate('sourceWarehouse', 'name code')
      .populate('destinationWarehouse', 'name code')
      .populate('sourceLocation', 'code')
      .populate('destinationLocation', 'code')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: transfers.length, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStockTransfer = async (req, res) => {
  try {
    const { product: productId, destinationWarehouse, destinationLocation, quantity, reasonNote } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock.reserved > 0) {
      return res.status(400).json({ success: false, message: `${product.name} has ${product.stock.reserved} units reserved for dispatch and cannot be relocated right now` });
    }
    if (product.warehouse.toString() === destinationWarehouse && (!destinationLocation || destinationLocation === product.location?.toString())) {
      return res.status(400).json({ success: false, message: 'Destination must be a different warehouse or bin location' });
    }
    const qty = Number(quantity);
    if (qty !== product.stock.available) {
      return res.status(400).json({
        success: false,
        message: `A transfer must move this product's full available quantity (${product.stock.available}) — a single product record can't be split across two locations`
      });
    }

    const transfer = await StockTransfer.create({
      product: productId,
      sourceWarehouse: product.warehouse,
      destinationWarehouse,
      sourceLocation: product.location,
      destinationLocation: destinationLocation || undefined,
      quantity: qty,
      reasonNote,
      status: 'requested',
      requestedBy: req.user._id
    });

    await logAudit({
      user: req.user,
      action: 'STOCK_TRANSFER_REQUEST',
      entityType: 'StockTransfer',
      entityId: transfer._id,
      newValues: transfer.toObject(),
      req
    });

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id).populate('product');
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    if (transfer.status !== 'requested') {
      return res.status(400).json({ success: false, message: `Only requested transfers can be approved (currently ${transfer.status})` });
    }
    if (transfer.quantity !== transfer.product.stock.available) {
      return res.status(400).json({ success: false, message: 'Available stock has changed since this transfer was requested — reject it and submit a new request' });
    }

    transfer.status = 'approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    await logAudit({
      user: req.user,
      action: 'STOCK_TRANSFER_APPROVE',
      entityType: 'StockTransfer',
      entityId: transfer._id,
      newValues: { status: transfer.status },
      req
    });

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.rejectStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    if (transfer.status !== 'requested') {
      return res.status(400).json({ success: false, message: `Only requested transfers can be rejected (currently ${transfer.status})` });
    }

    transfer.status = 'rejected';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    await logAudit({
      user: req.user,
      action: 'STOCK_TRANSFER_REJECT',
      entityType: 'StockTransfer',
      entityId: transfer._id,
      newValues: { status: transfer.status },
      req
    });

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.markInTransit = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id).populate('product');
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    if (transfer.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Only approved transfers can be marked in transit (currently ${transfer.status})` });
    }

    const product = transfer.product;
    if (product.stock.available < transfer.quantity) {
      return res.status(400).json({ success: false, message: 'Available stock has fallen below the transfer quantity — cannot proceed' });
    }

    product.stock.available -= transfer.quantity;
    await product.save();

    transfer.status = 'in_transit';
    await transfer.save();

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.completeStockTransfer = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id).populate('product');
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    if (transfer.status !== 'in_transit') {
      return res.status(400).json({ success: false, message: `Only in-transit transfers can be completed (currently ${transfer.status})` });
    }
    if (transfer.destinationLocation) {
      const loc = await Location.findOne({ _id: transfer.destinationLocation, warehouse: transfer.destinationWarehouse });
      if (!loc) return res.status(400).json({ success: false, message: 'Destination bin location is invalid for the destination warehouse' });
    }

    const product = transfer.product;
    product.warehouse = transfer.destinationWarehouse;
    product.location = transfer.destinationLocation || null;
    product.stock.available += transfer.quantity;
    await product.save();

    transfer.status = 'completed';
    await transfer.save();

    await logAudit({
      user: req.user,
      action: 'STOCK_TRANSFER_COMPLETE',
      entityType: 'StockTransfer',
      entityId: transfer._id,
      newValues: { status: transfer.status, product: product._id, newWarehouse: product.warehouse, newLocation: product.location },
      req
    });

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
