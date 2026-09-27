const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { sendMessage, getConversationMessages, deleteMessage, uploadFile } = require('../controllers/messageController');

const handleUpload = (req, res, next) => {
  const upload = uploadMiddleware.single('file');
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.post('/', authMiddleware, sendMessage);
router.post('/upload', authMiddleware, handleUpload, uploadFile);
router.get('/:conversationId', authMiddleware, getConversationMessages);
router.delete('/:messageId', authMiddleware, deleteMessage);

module.exports = router;
