const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const { logAudit } = require('../middleware/audit.middleware');

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).populate('manager', 'name email');
    res.status(200).json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    await logAudit({
      user: req.user,
      action: 'WAREHOUSE_CREATE',
      entityType: 'Warehouse',
      entityId: warehouse._id,
      newValues: warehouse.toObject(),
      req
    });
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const locations = await Location.find({ warehouse: warehouseId });
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
