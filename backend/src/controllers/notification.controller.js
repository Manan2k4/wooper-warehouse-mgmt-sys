const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const DispatchOrder = require('../models/DispatchOrder');

// Notifications are computed live from current data rather than a persisted inbox — there's no
// push infrastructure in this app, so "unread" isn't meaningful; the badge count is simply how
// many actionable alerts exist right now for this user's scope.
exports.getNotifications = async (req, res) => {
  try {
    const warehouseScope = ['warehouse_manager', 'warehouse_staff'].includes(req.user.role) && req.user.assignedWarehouse
      ? req.user.assignedWarehouse
      : null;

    const productQuery = { isActive: true };
    if (warehouseScope) productQuery.warehouse = warehouseScope;
    const products = await Product.find(productQuery).select('name sku stock reorderLevel warehouse');

    const notifications = [];

    for (const p of products) {
      if (p.stock.available === 0) {
        notifications.push({
          type: 'out_of_stock',
          severity: 'critical',
          message: `${p.name} (${p.sku}) is out of stock`,
          link: '/inventory',
          createdAt: null
        });
      } else if (p.stock.available <= p.reorderLevel) {
        notifications.push({
          type: 'low_stock',
          severity: 'warning',
          message: `${p.name} (${p.sku}) is low: ${p.stock.available}/${p.reorderLevel} reorder level`,
          link: '/inventory',
          createdAt: null
        });
      }
    }

    if (['super_admin', 'warehouse_manager', 'warehouse_staff'].includes(req.user.role)) {
      const poQuery = { status: { $in: ['pending', 'partially_received'] } };
      if (warehouseScope) poQuery.warehouse = warehouseScope;
      const openPOs = await PurchaseOrder.find(poQuery).select('poNumber status expectedDate');
      for (const po of openPOs) {
        notifications.push({
          type: 'po_open',
          severity: 'info',
          message: `Purchase order ${po.poNumber} is awaiting receiving (${po.status.replace('_', ' ')})`,
          link: `/purchase-orders/${po._id}`,
          createdAt: po.expectedDate
        });
      }

      const doQuery = { status: { $in: ['pending', 'picking', 'packed'] } };
      if (warehouseScope) doQuery.warehouse = warehouseScope;
      const openDOs = await DispatchOrder.find(doQuery).select('orderNumber status priority');
      for (const dispatchOrder of openDOs) {
        notifications.push({
          type: 'dispatch_open',
          severity: dispatchOrder.priority === 'urgent' ? 'critical' : 'info',
          message: `Dispatch order ${dispatchOrder.orderNumber} needs ${dispatchOrder.status === 'packed' ? 'shipping' : 'fulfillment'}`,
          link: `/dispatch-orders/${dispatchOrder._id}`,
          createdAt: null
        });
      }
    }

    const severityRank = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
