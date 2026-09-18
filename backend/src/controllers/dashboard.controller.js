const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const AuditLog = require('../models/AuditLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const warehouses = await Warehouse.find({ isActive: true });
    const products = await Product.find({ isActive: true });

    let totalAvailableStock = 0;
    let totalStockValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      totalAvailableStock += (p.stock?.available || 0);
      totalStockValuation += ((p.stock?.available || 0) * (p.costPrice || 0));
      if (p.stock?.available === 0) {
        outOfStockCount++;
      } else if (p.stock?.available <= (p.reorderLevel || 10)) {
        lowStockCount++;
      }
    });

    const recentActivities = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalWarehouses: warehouses.length,
        totalAvailableStock,
        totalStockValuation,
        lowStockCount,
        outOfStockCount,
        recentActivities,
        warehouses: warehouses.map(w => ({
          id: w._id,
          name: w.name,
          code: w.code,
          capacitySqFt: w.capacitySqFt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
