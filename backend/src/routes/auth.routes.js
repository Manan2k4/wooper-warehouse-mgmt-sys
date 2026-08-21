const express = require('express');
const router = express.Router();
const { login, getMe, getUsers } = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('super_admin'), getUsers);

module.exports = router;
