const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 
<<<<<<< HEAD
      'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
      'STOCK_ADJUSTMENT',
      'WAREHOUSE_CREATE', 'WAREHOUSE_UPDATE',
      'PURCHASE_ORDER_CREATE', 'PURCHASE_ORDER_CANCEL',
=======
      'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 
      'STOCK_ADJUSTMENT', 
      'WAREHOUSE_CREATE', 'WAREHOUSE_UPDATE', 
>>>>>>> c5ab6591203fab52473828b672a57871a7dbebba
      'RECEIVE', 'DISPATCH', 'STOCK_TRANSFER'
    ]
  },
  entityType: { type: String, required: true },
  entityId: { type: String },
  oldValues: { type: mongoose.Schema.Types.Mixed, default: null },
  newValues: { type: mongoose.Schema.Types.Mixed, default: null },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { 
  timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
