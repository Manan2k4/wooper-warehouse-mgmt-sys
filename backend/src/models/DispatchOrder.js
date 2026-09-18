const mongoose = require('mongoose');

const DispatchItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderedQty: { type: Number, required: true, min: 1 },
  pickedQty: { type: Number, default: 0, min: 0 },
  packedQty: { type: Number, default: 0, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const DispatchOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: {
    type: [DispatchItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'Dispatch order must contain at least one item'
    }
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: {
    type: String,
    enum: ['pending', 'picking', 'packed', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

DispatchOrderSchema.virtual('totalOrderedQty').get(function() {
  return this.items.reduce((sum, i) => sum + i.orderedQty, 0);
});
DispatchOrderSchema.virtual('totalValue').get(function() {
  return this.items.reduce((sum, i) => sum + i.orderedQty * i.unitPrice, 0);
});

DispatchOrderSchema.set('toJSON', { virtuals: true });
DispatchOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DispatchOrder', DispatchOrderSchema);
