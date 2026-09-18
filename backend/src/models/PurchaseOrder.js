const mongoose = require('mongoose');

const POItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderedQty: { type: Number, required: true, min: 1 },
  receivedQty: { type: Number, default: 0, min: 0 },
  unitCost: { type: Number, required: true, min: 0 }
}, { _id: false });

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  vendor: {
    name: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true }
  },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  expectedDate: { type: Date, required: true },
  items: {
    type: [POItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'Purchase order must contain at least one item'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'partially_received', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

PurchaseOrderSchema.virtual('totalOrderedQty').get(function() {
  return this.items.reduce((sum, i) => sum + i.orderedQty, 0);
});
PurchaseOrderSchema.virtual('totalReceivedQty').get(function() {
  return this.items.reduce((sum, i) => sum + i.receivedQty, 0);
});
PurchaseOrderSchema.virtual('totalValue').get(function() {
  return this.items.reduce((sum, i) => sum + i.orderedQty * i.unitCost, 0);
});

PurchaseOrderSchema.set('toJSON', { virtuals: true });
PurchaseOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
