const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  capacitySqFt: { type: Number, default: 10000 },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', WarehouseSchema);
