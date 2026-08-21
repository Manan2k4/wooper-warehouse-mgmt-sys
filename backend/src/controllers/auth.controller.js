const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../middleware/audit.middleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'wms_super_secret_jwt_key_2026_production', {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been disabled' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    await logAudit({
      user,
      action: 'LOGIN',
      entityType: 'Auth',
      entityId: user._id,
      newValues: { email: user.email, role: user.role },
      req
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedWarehouse: user.assignedWarehouse
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('assignedWarehouse', 'name code');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('assignedWarehouse', 'name code').select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
