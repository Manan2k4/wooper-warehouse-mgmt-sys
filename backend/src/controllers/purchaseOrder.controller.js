const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Location = require('../models/Location');
const { logAudit } = require('../middleware/audit.middleware');

const generatePONumber = async () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await PurchaseOrder.countDocuments({
    poNumber: { $regex: `^PO-${datePart}-` }
  });
  return `PO-${datePart}-${(count + 1).toString().padStart(4, '0')}`;
};

const recalculateStatus = (po) => {
  const totalOrdered = po.items.reduce((sum, i) => sum + i.orderedQty, 0);
  const totalReceived = po.items.reduce((sum, i) => sum + i.receivedQty, 0);
  if (totalReceived <= 0) return 'pending';
  if (totalReceived >= totalOrdered) return 'completed';
  return 'partially_received';
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const { status, warehouse, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { 'vendor.name': { $regex: search, $options: 'i' } }
      ];
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: purchaseOrders.length, data: purchaseOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('warehouse', 'name code address')
      .populate('createdBy', 'name role')
      .populate('items.product', 'name sku barcode unit');

    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    res.status(200).json({ success: true, data: purchaseOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { vendor, warehouse, expectedDate, items, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase order must contain at least one item' });
    }

    const productIds = items.map(i => i.product);
    const foundProducts = await Product.find({ _id: { $in: productIds } });
    if (foundProducts.length !== new Set(productIds).size) {
      return res.status(400).json({ success: false, message: 'One or more products in the order could not be found' });
    }

    const poNumber = await generatePONumber();

    const purchaseOrder = await PurchaseOrder.create({
      poNumber,
      vendor,
      warehouse,
      expectedDate,
      notes,
      items: items.map(i => ({
        product: i.product,
        orderedQty: Number(i.orderedQty),
        unitCost: Number(i.unitCost),
        receivedQty: 0
      })),
      status: 'pending',
      createdBy: req.user._id
    });

    await logAudit({
      user: req.user,
      action: 'PURCHASE_ORDER_CREATE',
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      newValues: purchaseOrder.toObject(),
      req
    });

    res.status(201).json({ success: true, data: purchaseOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.receiveItems = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items submitted for receiving' });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id).populate('items.product', 'name sku');
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    if (['completed', 'cancelled'].includes(purchaseOrder.status)) {
      return res.status(400).json({ success: false, message: `Cannot receive items on a ${purchaseOrder.status} purchase order` });
    }

    // Validate every line before mutating anything, so a bad line rejects the whole request.
    const plan = [];
    for (const incoming of items) {
      const qty = Number(incoming.receivedQty);
      if (!qty || qty <= 0) continue;

      const poItem = purchaseOrder.items.find(i => i.product._id.toString() === incoming.product);
      if (!poItem) {
        return res.status(400).json({ success: false, message: `Product ${incoming.product} is not part of this purchase order` });
      }

      const remaining = poItem.orderedQty - poItem.receivedQty;
      if (qty > remaining) {
        return res.status(400).json({
          success: false,
          message: `Cannot receive ${qty} units of ${poItem.product.name}; only ${remaining} remain on this order`
        });
      }

      if (incoming.location) {
        const location = await Location.findOne({ _id: incoming.location, warehouse: purchaseOrder.warehouse });
        if (!location) {
          return res.status(400).json({ success: false, message: `Invalid bin location for warehouse` });
        }
      }

      plan.push({ poItem, qty, locationId: incoming.location || null });
    }

    if (plan.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid quantities submitted for receiving' });
    }

    const oldValues = { status: purchaseOrder.status, items: purchaseOrder.items.map(i => ({ product: i.product._id, receivedQty: i.receivedQty })) };

    for (const { poItem, qty, locationId } of plan) {
      poItem.receivedQty += qty;
      const product = await Product.findById(poItem.product._id);
      product.stock.available += qty;
      if (locationId) product.location = locationId;
      await product.save();
    }

    purchaseOrder.status = recalculateStatus(purchaseOrder);
    await purchaseOrder.save();

    await logAudit({
      user: req.user,
      action: 'RECEIVE',
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      oldValues,
      newValues: {
        status: purchaseOrder.status,
        received: plan.map(p => ({ product: p.poItem.product.name, qty: p.qty }))
      },
      req
    });

    const populated = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name role')
      .populate('items.product', 'name sku barcode unit');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    if (purchaseOrder.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending purchase orders with no items received can be cancelled' });
    }

    const oldValues = { status: purchaseOrder.status };
    purchaseOrder.status = 'cancelled';
    await purchaseOrder.save();

    await logAudit({
      user: req.user,
      action: 'PURCHASE_ORDER_CANCEL',
      entityType: 'PurchaseOrder',
      entityId: purchaseOrder._id,
      oldValues,
      newValues: { status: purchaseOrder.status },
      req
    });

    res.status(200).json({ success: true, data: purchaseOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
