const DispatchOrder = require('../models/DispatchOrder');
const Product = require('../models/Product');
const { logAudit } = require('../middleware/audit.middleware');
const { sendLowStockAlert } = require('../utils/notifier');

const generateOrderNumber = async () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await DispatchOrder.countDocuments({
    orderNumber: { $regex: `^DO-${datePart}-` }
  });
  return `DO-${datePart}-${(count + 1).toString().padStart(4, '0')}`;
};

const locationSortKey = (loc) => loc?.code || 'ZZZZ';

exports.getDispatchOrders = async (req, res) => {
  try {
    const { status, warehouse, priority, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (warehouse) query.warehouse = warehouse;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const dispatchOrders = await DispatchOrder.find(query)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: dispatchOrders.length, data: dispatchOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDispatchOrderById = async (req, res) => {
  try {
    const dispatchOrder = await DispatchOrder.findById(req.params.id)
      .populate('warehouse', 'name code address')
      .populate('createdBy', 'name role')
      .populate({
        path: 'items.product',
        select: 'name sku barcode unit location',
        populate: { path: 'location', select: 'code zone rack shelf bin' }
      });

    if (!dispatchOrder) {
      return res.status(404).json({ success: false, message: 'Dispatch order not found' });
    }

    // Pick list sequence: sorted by bin location code so pickers walk the warehouse once, not back and forth.
    const pickSequence = [...dispatchOrder.items].sort((a, b) =>
      locationSortKey(a.product?.location).localeCompare(locationSortKey(b.product?.location))
    );

    res.status(200).json({ success: true, data: dispatchOrder, pickSequence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDispatchOrder = async (req, res) => {
  try {
    const { customer, warehouse, items, priority, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Dispatch order must contain at least one item' });
    }

    // Validate and reserve stock for every line before committing any change.
    const products = await Product.find({ _id: { $in: items.map(i => i.product) } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
      const product = productMap.get(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.product} could not be found` });
      }
      if (product.warehouse.toString() !== warehouse) {
        return res.status(400).json({ success: false, message: `${product.name} is not stocked at the selected warehouse` });
      }
      if (product.stock.available < Number(item.orderedQty)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient available stock for ${product.name}: requested ${item.orderedQty}, only ${product.stock.available} available`
        });
      }
    }

    for (const item of items) {
      const product = productMap.get(item.product);
      product.stock.available -= Number(item.orderedQty);
      product.stock.reserved += Number(item.orderedQty);
      await product.save();
      if (product.stock.available <= product.reorderLevel) {
        sendLowStockAlert({ product, warehouseId: product.warehouse });
      }
    }

    const orderNumber = await generateOrderNumber();
    const dispatchOrder = await DispatchOrder.create({
      orderNumber,
      customer,
      warehouse,
      priority: priority || 'medium',
      notes,
      items: items.map(i => ({
        product: i.product,
        orderedQty: Number(i.orderedQty),
        unitPrice: Number(i.unitPrice),
        pickedQty: 0,
        packedQty: 0
      })),
      status: 'pending',
      createdBy: req.user._id
    });

    await logAudit({
      user: req.user,
      action: 'DISPATCH_ORDER_CREATE',
      entityType: 'DispatchOrder',
      entityId: dispatchOrder._id,
      newValues: dispatchOrder.toObject(),
      req
    });

    res.status(201).json({ success: true, data: dispatchOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.recordPicking = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items submitted for picking' });
    }

    const dispatchOrder = await DispatchOrder.findById(req.params.id);
    if (!dispatchOrder) {
      return res.status(404).json({ success: false, message: 'Dispatch order not found' });
    }
    if (!['pending', 'picking'].includes(dispatchOrder.status)) {
      return res.status(400).json({ success: false, message: `Cannot pick items on a ${dispatchOrder.status} order` });
    }

    for (const incoming of items) {
      const qty = Number(incoming.pickedQty);
      if (!qty || qty <= 0) continue;
      const orderItem = dispatchOrder.items.find(i => i.product.toString() === incoming.product);
      if (!orderItem) {
        return res.status(400).json({ success: false, message: `Product ${incoming.product} is not part of this order` });
      }
      const remaining = orderItem.orderedQty - orderItem.pickedQty;
      if (qty > remaining) {
        return res.status(400).json({ success: false, message: `Cannot pick ${qty} units; only ${remaining} remain to pick` });
      }
      orderItem.pickedQty += qty;
    }

    dispatchOrder.status = 'picking';
    await dispatchOrder.save();

    await logAudit({
      user: req.user,
      action: 'PICK',
      entityType: 'DispatchOrder',
      entityId: dispatchOrder._id,
      newValues: { items: dispatchOrder.items.map(i => ({ product: i.product, pickedQty: i.pickedQty })) },
      req
    });

    res.status(200).json({ success: true, data: dispatchOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.recordPacking = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items submitted for packing' });
    }

    const dispatchOrder = await DispatchOrder.findById(req.params.id).populate('items.product', 'name sku barcode');
    if (!dispatchOrder) {
      return res.status(404).json({ success: false, message: 'Dispatch order not found' });
    }
    if (!['picking', 'packed'].includes(dispatchOrder.status)) {
      return res.status(400).json({ success: false, message: `Cannot pack items on a ${dispatchOrder.status} order` });
    }

    for (const incoming of items) {
      const orderItem = dispatchOrder.items.find(i => i.product._id.toString() === incoming.product);
      if (!orderItem) {
        return res.status(400).json({ success: false, message: `Scanned product ${incoming.product} is not part of this order — mispick blocked` });
      }
      if (orderItem.pickedQty < orderItem.orderedQty) {
        return res.status(400).json({
          success: false,
          message: `${orderItem.product.name} has not finished picking (${orderItem.pickedQty}/${orderItem.orderedQty}) — cannot pack yet`
        });
      }
      const qty = Number(incoming.packedQty);
      if (!qty || qty <= 0) continue;
      const remaining = orderItem.orderedQty - orderItem.packedQty;
      if (qty > remaining) {
        return res.status(400).json({ success: false, message: `Cannot pack ${qty} units of ${orderItem.product.name}; only ${remaining} remain` });
      }
      orderItem.packedQty += qty;
    }

    const fullyPacked = dispatchOrder.items.every(i => i.packedQty >= i.orderedQty);
    dispatchOrder.status = fullyPacked ? 'packed' : 'picking';
    await dispatchOrder.save();

    await logAudit({
      user: req.user,
      action: 'PACK',
      entityType: 'DispatchOrder',
      entityId: dispatchOrder._id,
      newValues: { items: dispatchOrder.items.map(i => ({ product: i.product._id, packedQty: i.packedQty })), status: dispatchOrder.status },
      req
    });

    res.status(200).json({ success: true, data: dispatchOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.dispatchOrder = async (req, res) => {
  try {
    const dispatchOrder = await DispatchOrder.findById(req.params.id).populate('items.product', 'name');
    if (!dispatchOrder) {
      return res.status(404).json({ success: false, message: 'Dispatch order not found' });
    }
    if (dispatchOrder.status !== 'packed') {
      return res.status(400).json({ success: false, message: 'Only fully packed orders can be dispatched' });
    }

    for (const item of dispatchOrder.items) {
      const product = await Product.findById(item.product._id);
      if (product.stock.reserved < item.orderedQty) {
        return res.status(400).json({ success: false, message: `Reserved stock inconsistency for ${item.product.name}` });
      }
      product.stock.reserved -= item.orderedQty;
      await product.save();
    }

    dispatchOrder.status = 'dispatched';
    await dispatchOrder.save();

    await logAudit({
      user: req.user,
      action: 'DISPATCH',
      entityType: 'DispatchOrder',
      entityId: dispatchOrder._id,
      newValues: { status: dispatchOrder.status },
      req
    });

    res.status(200).json({ success: true, data: dispatchOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.markDelivered = async (req, res) => {
  try {
    const dispatchOrder = await DispatchOrder.findById(req.params.id);
    if (!dispatchOrder) {
      return res.status(404).json({ success: false, message: 'Dispatch order not found' });
    }
    if (dispatchOrder.status !== 'dispatched') {
      return res.status(400).json({ success: false, message: 'Only dispatched orders can be marked delivered' });
    }

    dispatchOrder.status = 'delivered';
    await dispatchOrder.save();

    await logAudit({
      user: req.user,
      action: 'DELIVER',
      entityType: 'DispatchOrder',
      entityId: dispatchOrder._id,
      newValues: { status: dispatchOrder.status },
      req
    });

    res.status(200).json({ success: true, data: dispatchOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelDispatchOrder = async (req, res) => {
  try {
    const dispatchOrder = await DispatchOrder.findById(req.params.id);
    if (!dispatchOrder) {
      return res.status(404).json({ success: false, message: 'Dispatch order not found' });
    }
    if (dispatchOrder.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders (before picking has started) can be cancelled' });
    }

    for (const item of dispatchOrder.items) {
      const product = await Product.findById(item.product);
      product.stock.reserved -= item.orderedQty;
      product.stock.available += item.orderedQty;
      await product.save();
    }

    dispatchOrder.status = 'cancelled';
    await dispatchOrder.save();

    await logAudit({
      user: req.user,
      action: 'DISPATCH_ORDER_CANCEL',
      entityType: 'DispatchOrder',
      entityId: dispatchOrder._id,
      newValues: { status: dispatchOrder.status },
      req
    });

    res.status(200).json({ success: true, data: dispatchOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
