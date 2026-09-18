const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, user, limit = 50 } = req.query;
    let query = {};
    if (action) query.action = action;
    if (user) query.userName = { $regex: user, $options: 'i' };

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
