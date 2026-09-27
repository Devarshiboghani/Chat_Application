const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to create and emit a notification
const createNotification = async (io, userSocketsMap, senderId, receiverId, messageType) => {
  try {
    const sender = await User.findById(senderId).select('name');
    if (!sender) return;

    let messageText = `${sender.name} sent you a new message`;
    if (messageType === 'Image') {
      messageText = `${sender.name} sent you an image`;
    } else if (messageType === 'File') {
      messageText = `${sender.name} sent you a file`;
    }

    const notification = new Notification({
      userId: receiverId,
      message: messageText,
      type: 'Message'
    });

    await notification.save();

    // If receiver is online, emit real-time updates
    if (userSocketsMap && userSocketsMap.has(receiverId.toString()) && userSocketsMap.get(receiverId.toString()).size > 0) {
      const notificationData = {
        _id: notification._id,
        userId: notification.userId,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      };

      // Emit new_notification
      io.to(`user:${receiverId.toString()}`).emit('new_notification', notificationData);

      // Emit unread count update
      const count = await Notification.countDocuments({ userId: receiverId, isRead: false });
      io.to(`user:${receiverId.toString()}`).emit('notification_count_updated', { count });
    }
  } catch (error) {
    console.error('Create Notification Error:', error.message);
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 500) limit = 500;

    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ userId });
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        hasMore: total > skip + notifications.length
      }
    });
  } catch (error) {
    console.error('Get Notifications Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get Unread Notification Count Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification count'
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true } },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Emit updated count
    const io = req.app.get('io');
    const userSocketsMap = req.app.get('userSocketsMap');
    if (io && userSocketsMap && userSocketsMap.has(userId) && userSocketsMap.get(userId).size > 0) {
      const count = await Notification.countDocuments({ userId, isRead: false });
      io.to(`user:${userId}`).emit('notification_count_updated', { count });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark Notification Read Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Emit updated count
    const io = req.app.get('io');
    const userSocketsMap = req.app.get('userSocketsMap');
    if (io && userSocketsMap && userSocketsMap.has(userId) && userSocketsMap.get(userId).size > 0) {
      io.to(`user:${userId}`).emit('notification_count_updated', { count: 0 });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark All Notifications Read Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read'
    });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
