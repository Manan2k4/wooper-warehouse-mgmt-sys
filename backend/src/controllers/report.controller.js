const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const DispatchOrder = require('../models/DispatchOrder');

// Builds a FIFO cost basis per product from purchase-order receiving history. Each PO line with
// receivedQty > 0 becomes one cost layer dated by when it was last received (updatedAt). Layers
// are consumed oldest-first to value the product's current available quantity; any shortfall
// (stock older than PO tracking, e.g. initial seed data) falls back to the product's costPrice.
const buildFifoValuation = async (products) => {
  const productIds = products.map(p => p._id);
  const purchaseOrders = await PurchaseOrder.find({ 'items.product': { $in: productIds } }).sort({ updatedAt: 1 });

  const layersByProduct = new Map();
  for (const po of purchaseOrders) {
    for (const item of po.items) {
      if (item.receivedQty <= 0) continue;
      const key = item.product.toString();
      if (!layersByProduct.has(key)) layersByProduct.set(key, []);
      layersByProduct.get(key).push({ qty: item.receivedQty, unitCost: item.unitCost, date: po.updatedAt });
    }
  }

  return products.map(product => {
    const layers = layersByProduct.get(product._id.toString()) || [];
    let remaining = product.stock.available;
    let cost = 0;
    for (const layer of layers) {
      if (remaining <= 0) break;
      const used = Math.min(remaining, layer.qty);
      cost += used * layer.unitCost;
      remaining -= used;
    }
    if (remaining > 0) cost += remaining * product.costPrice; // shortfall: pre-dates PO history
    return { product, valuation: cost, method: 'fifo' };
  });
};

const buildAverageValuation = (products) => products.map(product => ({
  product,
  valuation: product.stock.available * product.costPrice,
  method: 'average'
}));

exports.getStockValuationReport = async (req, res) => {
  try {
    const method = req.query.method === 'fifo' ? 'fifo' : 'average';
    const products = await Product.find({ isActive: true }).populate('category', 'name').populate('warehouse', 'name code');

    const rows = method === 'fifo' ? await buildFifoValuation(products) : buildAverageValuation(products);
    const totalValuation = rows.reduce((sum, r) => sum + r.valuation, 0);

    res.status(200).json({
      success: true,
      method,
      totalValuation,
      data: rows.map(r => ({
        productId: r.product._id,
        name: r.product.name,
        sku: r.product.sku,
        category: r.product.category?.name,
        warehouse: r.product.warehouse?.name,
        availableQty: r.product.stock.available,
        costPrice: r.product.costPrice,
        valuation: r.valuation
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVelocityReport = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dispatchOrders = await DispatchOrder.find({
      createdAt: { $gte: since },
      status: { $ne: 'cancelled' }
    }).populate('items.product', 'name sku unit costPrice sellingPrice');

    const movement = new Map();
    for (const order of dispatchOrders) {
      for (const item of order.items) {
        if (!item.product) continue;
        const key = item.product._id.toString();
        if (!movement.has(key)) {
          movement.set(key, { product: item.product, unitsDispatched: 0, orderCount: 0 });
        }
        const entry = movement.get(key);
        entry.unitsDispatched += item.orderedQty;
        entry.orderCount += 1;
      }
    }

    const moversList = Array.from(movement.values()).sort((a, b) => b.unitsDispatched - a.unitsDispatched);
    const movedProductIds = new Set(moversList.map(m => m.product._id.toString()));
    const deadStock = await Product.find({ isActive: true, _id: { $nin: Array.from(movedProductIds) } })
      .select('name sku unit stock');

    res.status(200).json({
      success: true,
      windowDays: days,
      fastMovers: moversList.slice(0, 20).map(m => ({
        productId: m.product._id,
        name: m.product.name,
        sku: m.product.sku,
        unitsDispatched: m.unitsDispatched,
        orderCount: m.orderCount
      })),
      slowMovers: moversList.slice(-20).reverse().map(m => ({
        productId: m.product._id,
        name: m.product.name,
        sku: m.product.sku,
        unitsDispatched: m.unitsDispatched,
        orderCount: m.orderCount
      })),
      deadStock: deadStock.map(p => ({ productId: p._id, name: p.name, sku: p.sku, availableQty: p.stock.available }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpiryReport = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, expiryDate: { $ne: null } })
      .populate('warehouse', 'name')
      .sort({ expiryDate: 1 });

    const now = Date.now();
    const rows = products.map(p => {
      const daysUntilExpiry = Math.floor((new Date(p.expiryDate).getTime() - now) / (24 * 60 * 60 * 1000));
      let bucket;
      if (daysUntilExpiry < 0) bucket = 'expired';
      else if (daysUntilExpiry <= 30) bucket = 'critical';
      else if (daysUntilExpiry <= 90) bucket = 'warning';
      else bucket = 'ok';
      return {
        productId: p._id,
        name: p.name,
        sku: p.sku,
        warehouse: p.warehouse?.name,
        availableQty: p.stock.available,
        expiryDate: p.expiryDate,
        daysUntilExpiry,
        bucket
      };
    });

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportInventoryCsv = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category', 'name').populate('warehouse', 'name');
    const header = 'SKU,Name,Category,Warehouse,Available,Reserved,Damaged,Returned,CostPrice,SellingPrice\n';
    const rows = products.map(p => [
      p.sku, `"${p.name.replace(/"/g, '""')}"`, p.category?.name || '', p.warehouse?.name || '',
      p.stock.available, p.stock.reserved, p.stock.damaged, p.stock.returned, p.costPrice, p.sellingPrice
    ].join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-export.csv"');
    res.status(200).send(header + rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportInventoryExcel = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category', 'name').populate('warehouse', 'name');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory');
    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 16 },
      { header: 'Name', key: 'name', width: 32 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Warehouse', key: 'warehouse', width: 24 },
      { header: 'Available', key: 'available', width: 12 },
      { header: 'Reserved', key: 'reserved', width: 12 },
      { header: 'Damaged', key: 'damaged', width: 12 },
      { header: 'Returned', key: 'returned', width: 12 },
      { header: 'Cost Price', key: 'costPrice', width: 12 },
      { header: 'Selling Price', key: 'sellingPrice', width: 14 },
      { header: 'Valuation', key: 'valuation', width: 14 }
    ];
    sheet.getRow(1).font = { bold: true };

    products.forEach(p => {
      sheet.addRow({
        sku: p.sku,
        name: p.name,
        category: p.category?.name || '',
        warehouse: p.warehouse?.name || '',
        available: p.stock.available,
        reserved: p.stock.reserved,
        damaged: p.stock.damaged,
        returned: p.stock.returned,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        valuation: p.stock.available * p.costPrice
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-export.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportValuationPdf = async (req, res) => {
  try {
    const method = req.query.method === 'fifo' ? 'fifo' : 'average';
    const products = await Product.find({ isActive: true }).populate('category', 'name').populate('warehouse', 'name');
    const rows = method === 'fifo' ? await buildFifoValuation(products) : buildAverageValuation(products);
    const totalValuation = rows.reduce((sum, r) => sum + r.valuation, 0);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stock-valuation-report.pdf"');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).text('Stock Valuation Report', { align: 'left' });
    doc.fontSize(10).fillColor('#666').text(`Method: ${method.toUpperCase()}  |  Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    const startX = doc.x;
    let y = doc.y;
    const colWidths = [90, 160, 80, 70, 80];
    const headers = ['SKU', 'Product', 'Warehouse', 'Qty', 'Valuation'];

    doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
    });
    y += 16;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).strokeColor('#333').stroke();
    y += 6;

    doc.font('Helvetica').fontSize(8.5);
    rows.forEach(r => {
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
      const values = [r.product.sku, r.product.name, r.product.warehouse?.name || '', String(r.product.stock.available), `$${r.valuation.toFixed(2)}`];
      values.forEach((v, i) => {
        doc.text(v, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
      });
      y += 14;
    });

    y += 10;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).strokeColor('#333').stroke();
    y += 8;
    doc.font('Helvetica-Bold').fontSize(11).text(`Total Valuation: $${totalValuation.toFixed(2)}`, startX, y);

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
