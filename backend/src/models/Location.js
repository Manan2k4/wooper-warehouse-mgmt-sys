const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone: { type: String, required: true, uppercase: true, trim: true },
  rack: { type: String, required: true, uppercase: true, trim: true },
  shelf: { type: String, required: true, uppercase: true, trim: true },
  bin: { type: String, required: true, uppercase: true, trim: true },
  code: { type: String, unique: true, required: true },
  maxWeightKg: { type: Number, default: 500 },
  isOccupied: { type: Boolean, default: false }
}, { timestamps: true });

LocationSchema.pre('validate', function(next) {
  if (this.zone && this.rack && this.shelf && this.bin) {
    this.code = `${this.zone}-${this.rack}-${this.shelf}-${this.bin}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Location', LocationSchema);
