const Product = require('../models/Product');
const Category = require('../models/Category');
const { generateSKU, generateBarcode, generateQRCode } = require('../utils/barcode');
const { logAudit } = require('../middleware/audit.middleware');

exports.getProducts = async (req, res) => {
  try {
    const { search, category, warehouse, lowStock } = req.query;
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (warehouse) query.warehouse = warehouse;

    let products = await Product.find(query)
      .populate('category', 'name code')
      .populate('warehouse', 'name code')
      .populate('location', 'code zone rack shelf bin')
      .sort({ createdAt: -1 });

    if (lowStock === 'true') {
      products = products.filter(p => p.stock.available <= p.reorderLevel);
    }

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category warehouse location');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const categoryDoc = await Category.findById(req.body.category);
    const sku = req.body.sku || generateSKU(categoryDoc?.code, req.body.brand, req.body.name);
    const barcode = req.body.barcode || generateBarcode();
    const qrCodeData = await generateQRCode(JSON.stringify({ sku, barcode, name: req.body.name }));

    const product = await Product.create({
      ...req.body,
      sku,
      barcode,
      qrCodeData
    });

    await logAudit({
      user: req.user,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product._id,
      newValues: product.toObject(),
      req
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const oldValues = product.toObject();
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    await logAudit({
      user: req.user,
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: product._id,
      oldValues,
      newValues: updated.toObject(),
      req
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.lookupByBarcode = async (req, res) => {
  try {
    const { code } = req.params;
    const product = await Product.findOne({
      $or: [{ barcode: code }, { sku: code }]
    }).populate('category warehouse location');

    if (!product) {
      return res.status(404).json({ success: false, message: `No product found matching code '${code}'` });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
