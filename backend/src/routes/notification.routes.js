const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);

module.exports = router;
