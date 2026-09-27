const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, content } = req.body;
    const senderId = req.user.userId;

    if (!conversationId || !receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'conversationId, receiverId, and content are required'
      });
    }

    if (content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message content too long'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ObjectId format'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(p => p.toString() === senderId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const isReceiverParticipant = conversation.participants.some(p => p.toString() === receiverId);
    if (!isReceiverParticipant || receiverId === senderId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver is not part of this conversation'
      });
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      messageType: 'Text',
      content,
      status: 'Sent'
    });

    await newMessage.save();

    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = newMessage.createdAt;
    await conversation.save();

    const messageData = {
      _id: newMessage._id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      messageType: newMessage.messageType,
      content: newMessage.content,
      status: newMessage.status,
      createdAt: newMessage.createdAt
    };

    const io = req.app.get('io');
    const userSocketsMap = req.app.get('userSocketsMap');
    if (io) {
      const { createNotification } = require('./notificationController');
      await createNotification(io, userSocketsMap, senderId, receiverId, 'Text');
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageData
    });
  } catch (error) {
    console.error('Send Message Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    let { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId format'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(p => p.toString() === req.user.userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const total = await Message.countDocuments({ conversationId });
    
    // Fetch messages newest first to get the correct page, then reverse for natural display
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', '_id name profileImage')
      .populate('receiverId', '_id name profileImage');

    const formattedMessages = messages.reverse().map(m => ({
      id: m._id,
      conversationId: m.conversationId,
      sender: m.senderId,
      receiver: m.receiverId,
      messageType: m.messageType,
      content: m.content,
      status: m.status,
      createdAt: m.createdAt
    }));

    res.status(200).json({
      success: true,
      messages: formattedMessages,
      pagination: {
        page,
        limit,
        total,
        hasMore: total > skip + messages.length
      }
    });

  } catch (error) {
    console.error('Get Messages Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid messageId format'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    const conversationId = message.conversationId;
    const messageType = message.messageType;
    const contentUrl = message.content;

    await Message.findByIdAndDelete(messageId);

    // Delete physical file
    if ((messageType === 'Image' || messageType === 'File') && contentUrl) {
      try {
        // contentUrl looks like /uploads/images/file.jpg
        const filePath = path.join(__dirname, '..', contentUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to delete physical file:', err.message);
      }
    }

    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.lastMessage && conversation.lastMessage.toString() === messageId.toString()) {
      const newLastMessage = await Message.findOne({ conversationId }).sort({ createdAt: -1 });
      if (newLastMessage) {
        conversation.lastMessage = newLastMessage._id;
        conversation.lastMessageAt = newLastMessage.createdAt;
      } else {
        conversation.lastMessage = null;
        conversation.lastMessageAt = null;
      }
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete Message Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
};

const uploadFile = async (req, res) => {
  try {
    const { conversationId, receiverId } = req.body;
    const senderId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const isImage = req.file.mimetype.startsWith('image/');

    // Additional file size validation for images
    if (isImage && req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Image size exceeds 5MB limit' });
    }

    if (!conversationId || !receiverId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'conversationId and receiverId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid ObjectId format' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(p => p.toString() === senderId);
    if (!isParticipant) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
    }

    const isReceiverParticipant = conversation.participants.some(p => p.toString() === receiverId);
    if (!isReceiverParticipant || receiverId === senderId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Receiver is not part of this conversation' });
    }

    // Determine message type and URL
    const messageType = isImage ? 'Image' : 'File';
    const folder = isImage ? 'images' : 'files';
    const contentUrl = `/uploads/${folder}/${req.file.filename}`;

    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      messageType,
      content: contentUrl,
      status: 'Sent'
    });

    await newMessage.save();

    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = newMessage.createdAt;
    await conversation.save();

    const messageData = {
      _id: newMessage._id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      messageType: newMessage.messageType,
      content: newMessage.content,
      status: newMessage.status,
      createdAt: newMessage.createdAt
    };

    // Socket.IO emission
    const io = req.app.get('io');
    const userSocketsMap = req.app.get('userSocketsMap');

    if (io) {
      // Emit to receiver's room
      io.to(`user:${receiverId}`).emit('receive_message', messageData);
      // Emit to sender's room
      io.to(`user:${senderId}`).emit('receive_message', messageData);

      // Delivered logic
      if (userSocketsMap && userSocketsMap.has(receiverId) && userSocketsMap.get(receiverId).size > 0) {
        newMessage.status = 'Delivered';
        await newMessage.save();
        messageData.status = 'Delivered';

        io.to(`user:${senderId}`).emit('message_status_updated', {
          messageId: newMessage._id,
          conversationId: newMessage.conversationId,
          status: 'Delivered'
        });
      }

      // Notification logic
      const { createNotification } = require('./notificationController');
      await createNotification(io, userSocketsMap, senderId, receiverId, messageType);
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        message: messageData
      }
    });

  } catch (error) {
    console.error('Upload Error:', error.message);
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      message: 'Server error while uploading file'
    });
  }
};

module.exports = {
  sendMessage,
  getConversationMessages,
  deleteMessage,
  uploadFile
};
