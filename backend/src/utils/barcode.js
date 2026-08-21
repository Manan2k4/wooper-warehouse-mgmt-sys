const QRCode = require('qrcode');

exports.generateSKU = (categoryCode = 'GEN', brand = 'GEN', name = '') => {
  const cat = categoryCode.substring(0, 3).toUpperCase();
  const br = brand.substring(0, 3).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${cat}-${br}-${rand}`;
};

exports.generateBarcode = () => {
  return `BC-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;
};

exports.generateQRCode = async (dataString) => {
  try {
    return await QRCode.toDataURL(dataString);
  } catch (err) {
    console.error('QR Generation failed:', err);
    return '';
  }
};
