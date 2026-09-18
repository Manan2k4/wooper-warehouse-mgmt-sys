const mongoose = require('mongoose');

const StockAdjustmentRequestSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  reasonCode: {
    type: String,
    enum: ['damaged_in_transit', 'expired', 'count_discrepancy', 'write_off'],
    required: true
  },
  // For damaged_in_transit / expired / write_off: units affected.
  // For count_discrepancy: the physically counted quantity (system computes the delta at approval time).
  quantity: { type: Number, required: true, min: 0 },
  note: { type: String, trim: true },
  status: { type: String, enum: ['pending_approval', 'approved', 'rejected'], default: 'pending_approval' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appliedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('StockAdjustmentRequest', StockAdjustmentRequestSchema);
