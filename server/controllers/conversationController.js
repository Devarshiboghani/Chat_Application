const Conversation = require('../models/Conversation');
const User = require('../models/User');
const mongoose = require('mongoose');
const Message = require('../models/Message');

const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.userId;

    // Validate userId presence
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId format'
      });
    }

    // Prevent self-conversation
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a conversation with yourself'
      });
    }

    // Verify second user exists
    const secondUser = await User.findById(userId);
    if (!secondUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for existing conversation (order independent)
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] }
    }).populate('participants', 'name profileImage status lastSeen').populate('lastMessage');

    if (conversation) {
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        conversation: {
          id: conversation._id,
          participants: conversation.participants,
          lastMessage: conversation.lastMessage ? conversation.lastMessage.content : '',
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt
        }
      });
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [currentUserId, userId]
    });

    await conversation.save();
    
    // Populate participants before sending
    await conversation.populate('participants', 'name profileImage status lastSeen');

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversation: {
        id: conversation._id,
        participants: conversation.participants,
        lastMessage: '',
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt
      }
    });

  } catch (error) {
    console.error('Create Conversation Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while creating conversation'
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'name profileImage status lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    const formattedConversations = await Promise.all(conversations.map(async (c) => {
      const unreadCount = await Message.countDocuments({
        conversationId: c._id,
        receiverId: currentUserId,
        status: { $ne: 'Read' }
      });
      return {
        id: c._id,
        participants: c.participants,
        lastMessage: c.lastMessage ? c.lastMessage.content : '',
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
        unreadCount
      };
    }));

    res.status(200).json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Get Conversations Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
};

const getConversationWithUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId format'
      });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] }
    }).populate('participants', 'name profileImage status lastSeen').populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      conversation: {
        id: conversation._id,
        participants: conversation.participants,
        lastMessage: conversation.lastMessage ? conversation.lastMessage.content : '',
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt
      }
    });

  } catch (error) {
    console.error('Get Conversation With User Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversation'
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationWithUser
};
