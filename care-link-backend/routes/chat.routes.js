const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, getChatHistory, clearChat } = require('../controllers/chatController');

const router = express.Router();

// Rate limiter: max 30 chat requests per minute per IP
const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: {
        message: 'Too many requests. Please wait a moment before sending another message.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// All routes require authentication
router.use(protect);

// POST /api/chat — Send a message and get AI response
router.post('/', chatLimiter, sendMessage);

// GET /api/chat/history — Get chat history
router.get('/history', getChatHistory);

// DELETE /api/chat/clear — Clear chat history
router.delete('/clear', clearChat);

module.exports = router;
