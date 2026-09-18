const mongoose = require('mongoose');

const StockTransferSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  // A product record lives at exactly one warehouse/bin at a time (see Product model), so a
  // transfer always relocates the product's FULL available quantity — partial cross-location
  // splits of the same SKU aren't representable without duplicating the catalog entry.
  quantity: { type: Number, required: true, min: 1 },
  reasonNote: { type: String, trim: true },
  status: {
    type: String,
    enum: ['requested', 'approved', 'in_transit', 'completed', 'rejected'],
    default: 'requested'
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('StockTransfer', StockTransferSchema);
