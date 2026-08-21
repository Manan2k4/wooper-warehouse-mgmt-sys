const AuditLog = require('../models/AuditLog');

exports.logAudit = async ({ user, action, entityType, entityId, oldValues, newValues, req }) => {
  try {
    await AuditLog.create({
      user: user?._id || user?.id,
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      oldValues,
      newValues,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1',
      userAgent: req ? req.headers['user-agent'] : 'System'
    });
  } catch (err) {
    console.error('Audit Logging failed:', err.message);
  }
};
