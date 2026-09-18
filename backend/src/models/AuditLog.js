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
      'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
      'STOCK_ADJUSTMENT',
      'WAREHOUSE_CREATE', 'WAREHOUSE_UPDATE',
      'PURCHASE_ORDER_CREATE', 'PURCHASE_ORDER_CANCEL',
      'DISPATCH_ORDER_CREATE', 'DISPATCH_ORDER_CANCEL', 'PICK', 'PACK', 'DELIVER',
      'STOCK_TRANSFER_REQUEST', 'STOCK_TRANSFER_APPROVE', 'STOCK_TRANSFER_REJECT', 'STOCK_TRANSFER_COMPLETE',
      'STOCK_ADJUSTMENT_REQUEST', 'STOCK_ADJUSTMENT_APPROVE', 'STOCK_ADJUSTMENT_REJECT',
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
