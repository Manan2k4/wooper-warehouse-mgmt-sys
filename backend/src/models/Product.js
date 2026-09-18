const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  barcode: { type: String, required: true, unique: true, trim: true },
  qrCodeData: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, default: 'Generic', trim: true },
  unit: { type: String, default: 'PCS', enum: ['PCS', 'BOX', 'KG', 'LITRE', 'PALLET'] },
  description: { type: String },
  costPrice: { type: Number, required: true, default: 0, min: 0 },
  sellingPrice: { type: Number, required: true, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 10, min: 0 },
  
  // Stock Tracking Breakdown
  stock: {
    available: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    damaged: { type: Number, default: 0, min: 0 },
    returned: { type: Number, default: 0, min: 0 }
  },
  
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  
  batchNumber: { type: String, trim: true },
  expiryDate: { type: Date },
  imageUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ProductSchema.virtual('totalStock').get(function() {
  return (this.stock?.available || 0) + (this.stock?.reserved || 0) + (this.stock?.damaged || 0) + (this.stock?.returned || 0);
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
