const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} = require('../controllers/notificationController');

router.get('/', authMiddleware, getNotifications);
router.get('/unread-count', authMiddleware, getUnreadNotificationCount);
router.put('/read-all', authMiddleware, markAllNotificationsAsRead);
router.put('/:notificationId/read', authMiddleware, markNotificationAsRead);

module.exports = router;
