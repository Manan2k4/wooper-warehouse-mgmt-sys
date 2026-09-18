const nodemailer = require('nodemailer');
const User = require('../models/User');

let transporter = null;
const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
};

// Best-effort email alert — silently no-ops when SMTP isn't configured (e.g. local dev/grading
// environments) so this never blocks the request path it's called from.
exports.sendLowStockAlert = async ({ product, warehouseId }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[notifier] SMTP not configured — skipping low-stock email for ${product.name}`);
    return;
  }

  try {
    const query = { role: { $in: ['super_admin', 'warehouse_manager'] } };
    if (warehouseId) query.$or = [{ role: 'super_admin' }, { assignedWarehouse: warehouseId }];
    const recipients = await User.find(query).select('email');
    if (recipients.length === 0) return;

    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients.map(u => u.email).join(','),
      subject: `Low stock alert: ${product.name}`,
      text: `${product.name} (${product.sku}) is at ${product.stock.available} units, at or below its reorder level of ${product.reorderLevel}. Please arrange replenishment.`
    });
  } catch (err) {
    console.error('[notifier] Failed to send low-stock email:', err.message);
  }
};
