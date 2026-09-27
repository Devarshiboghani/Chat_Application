const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const userSocketsMap = new Map();
const offlineTimeouts = new Map();

const chatSocket = (io) => {
  // Middleware for socket authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Join a private room for the authenticated user
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    // Handle online status
    try {
      if (!userSocketsMap.has(userId) || userSocketsMap.get(userId).size === 0) {
        if (!userSocketsMap.has(userId)) userSocketsMap.set(userId, new Set());
        // First connection, mark online
        await User.findByIdAndUpdate(userId, { status: 'Online' });
        io.emit('user_status_changed', {
          userId,
          status: 'Online',
          lastSeen: null
        });
      }
      userSocketsMap.get(userId).add(socket.id);

      if (offlineTimeouts.has(userId)) {
        clearTimeout(offlineTimeouts.get(userId));
        offlineTimeouts.delete(userId);
      }
    } catch (error) {
      console.error('Error handling online status:', error.message);
    }
    
    // Handle send_message event
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, receiverId, content } = data;
        const senderId = socket.userId;

        // Validation
        if (!conversationId || !receiverId || !content) {
          if (callback) callback({ success: false, message: 'conversationId, receiverId, and content are required' });
          return;
        }

        if (content.trim() === '') {
          if (callback) callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        if (content.length > 2000) {
          if (callback) callback({ success: false, message: 'Message content too long' });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
          if (callback) callback({ success: false, message: 'Invalid ObjectId format' });
          return;
        }

        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        // Verify sender and receiver belong to conversation
        const isSenderParticipant = conversation.participants.some(p => p.toString() === senderId);
        if (!isSenderParticipant) {
          if (callback) callback({ success: false, message: 'You are not a participant in this conversation' });
          return;
        }

        const isReceiverParticipant = conversation.participants.some(p => p.toString() === receiverId);
        if (!isReceiverParticipant || receiverId === senderId) {
          if (callback) callback({ success: false, message: 'Receiver is not part of this conversation' });
          return;
        }

        // Save message to MongoDB
        const newMessage = new Message({
          conversationId,
          senderId,
          receiverId,
          messageType: data.messageType || 'Text',
          content,
          status: 'Sent'
        });

        await newMessage.save();

        // Update conversation's lastMessage
        conversation.lastMessage = newMessage._id;
        conversation.lastMessageAt = newMessage.createdAt;
        await conversation.save();

        let messageData = {
          _id: newMessage._id,
          conversationId: newMessage.conversationId,
          senderId: newMessage.senderId,
          receiverId: newMessage.receiverId,
          messageType: newMessage.messageType,
          content: newMessage.content,
          status: newMessage.status,
          createdAt: newMessage.createdAt
        };

        // Emit to receiver's room
        io.to(`user:${receiverId}`).emit('receive_message', messageData);
        // Emit to sender's room (so multiple tabs stay in sync)
        io.to(`user:${senderId}`).emit('receive_message', messageData);

        // Acknowledge success to the sending client
        if (callback) {
          callback({
            success: true,
            message: 'Message sent successfully'
          });
        }

        // Delivered logic
        if (userSocketsMap.has(receiverId) && userSocketsMap.get(receiverId).size > 0) {
          newMessage.status = 'Delivered';
          await newMessage.save();

          io.to(`user:${senderId}`).emit('message_status_updated', {
            messageId: newMessage._id,
            conversationId: newMessage.conversationId,
            status: 'Delivered'
          });
        }

        // Notification logic
        const { createNotification } = require('../controllers/notificationController');
        await createNotification(io, userSocketsMap, senderId, receiverId, 'Text');

      } catch (error) {
        console.error('Socket Send Message Error:', error.message);
        if (callback) {
          callback({ success: false, message: 'Server error while sending message' });
        }
      }
    });

    socket.on('typing_start', async (data) => {
      try {
        const { conversationId, receiverId } = data;
        const senderId = socket.userId;
        
        if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(receiverId)) return;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        
        const isParticipant = conversation.participants.some(p => p.toString() === senderId);
        const isReceiverParticipant = conversation.participants.some(p => p.toString() === receiverId);
        
        if (isParticipant && isReceiverParticipant && senderId !== receiverId) {
          io.to(`user:${receiverId}`).emit('user_typing', {
            conversationId,
            userId: senderId
          });
        }
      } catch (e) {
        console.error('Typing start error', e.message);
      }
    });

    socket.on('typing_stop', async (data) => {
      try {
        const { conversationId, receiverId } = data;
        const senderId = socket.userId;
        
        if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(receiverId)) return;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        
        const isParticipant = conversation.participants.some(p => p.toString() === senderId);
        const isReceiverParticipant = conversation.participants.some(p => p.toString() === receiverId);
        
        if (isParticipant && isReceiverParticipant && senderId !== receiverId) {
          io.to(`user:${receiverId}`).emit('user_stopped_typing', {
            conversationId,
            userId: senderId
          });
        }
      } catch (e) {
        console.error('Typing stop error', e.message);
      }
    });

    socket.on('mark_messages_read', async (data) => {
      try {
        const { conversationId } = data;
        const userId = socket.userId;
        
        if (!mongoose.Types.ObjectId.isValid(conversationId)) return;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        
        const isParticipant = conversation.participants.some(p => p.toString() === userId);
        if (!isParticipant) return;
        
        // Find unread messages received by current user in this conversation
        const unreadMessages = await Message.find({
          conversationId,
          receiverId: userId,
          status: { $ne: 'Read' }
        });
        
        if (unreadMessages.length > 0) {
          await Message.updateMany(
            { conversationId, receiverId: userId, status: { $ne: 'Read' } },
            { $set: { status: 'Read' } }
          );
          
          const otherParticipantId = conversation.participants.find(p => p.toString() !== userId).toString();
          
          unreadMessages.forEach(msg => {
            io.to(`user:${otherParticipantId}`).emit('message_status_updated', {
              messageId: msg._id,
              conversationId,
              status: 'Read'
            });
          });
        }
      } catch (e) {
        console.error('Mark read error', e.message);
      }
    });

    socket.on('delete_message', async (data, callback) => {
      try {
        const { messageId, conversationId } = data;
        const userId = socket.userId;
        
        if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(conversationId)) {
          if (callback) callback({ success: false, message: 'Invalid ID' });
          return;
        }
        
        const message = await Message.findById(messageId);
        if (!message) {
          if (callback) callback({ success: false, message: 'Message not found' });
          return;
        }
        
        if (message.senderId.toString() !== userId) {
          if (callback) callback({ success: false, message: 'You can only delete your own messages' });
          return;
        }

        await Message.findByIdAndDelete(messageId);
        
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
           const otherParticipantId = conversation.participants.find(p => p.toString() !== userId).toString();
           io.to(`user:${otherParticipantId}`).emit('message_deleted', { messageId, conversationId });
           io.to(`user:${userId}`).emit('message_deleted', { messageId, conversationId });
        }
        
        if (callback) callback({ success: true });
      } catch (err) {
        console.error('Delete message error', err.message);
      }
    });

    socket.on('disconnect', () => {
      try {
        if (userSocketsMap.has(userId)) {
          const userSockets = userSocketsMap.get(userId);
          userSockets.delete(socket.id);

          if (userSockets.size === 0) {
            // Set a timeout to allow for brief network interruptions or page reloads
            const timeout = setTimeout(async () => {
              try {
                // Verify user hasn't reconnected
                if (!userSocketsMap.has(userId) || userSocketsMap.get(userId).size === 0) {
                  userSocketsMap.delete(userId);
                  
                  // Final socket disconnected, mark offline
                  const lastSeen = new Date();
                  await User.findByIdAndUpdate(userId, { status: 'Offline', lastSeen });
                  io.emit('user_status_changed', {
                    userId,
                    status: 'Offline',
                    lastSeen
                  });
                }
              } catch (err) {
                console.error(`[Offline Status Error] Failed to update user ${userId}:`, err.stack);
              } finally {
                offlineTimeouts.delete(userId);
              }
            }, 5000); // 5 seconds grace period
            
            offlineTimeouts.set(userId, timeout);
          }
        }
      } catch (error) {
        console.error('Error handling socket disconnect:', error.stack);
      }
    });
  });
};

module.exports = {
  chatSocket,
  userSocketsMap
};
