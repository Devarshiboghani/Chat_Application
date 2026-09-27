const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createConversation, getConversations, getConversationWithUser } = require('../controllers/conversationController');

router.post('/', authMiddleware, createConversation);
router.get('/', authMiddleware, getConversations);
router.get('/with/:userId', authMiddleware, getConversationWithUser);

module.exports = router;
