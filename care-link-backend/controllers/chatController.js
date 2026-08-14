const ChatMessage = require('../models/ChatMessage');
const { generateChatResponse } = require('../services/geminiService');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Send a message to the AI chatbot and get a response
 * @route   POST /api/chat
 * @access  Private
 */
const sendMessage = async (req, res) => {
    try {
        const { message, sessionId: clientSessionId } = req.body;
        const userId = req.user._id;
        const userName = req.user.fullName || 'there';

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Use provided sessionId or create a new one
        const sessionId = clientSessionId || uuidv4();

        // Find or create the chat session
        let chatSession = await ChatMessage.findOne({ userId, sessionId });

        if (!chatSession) {
            chatSession = new ChatMessage({
                userId,
                sessionId,
                messages: []
            });
        }

        // Get the last 20 messages for context (to avoid token limits)
        const recentHistory = chatSession.messages.slice(-20).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Generate AI response
        const aiResult = await generateChatResponse(recentHistory, message.trim(), userName);

        // Create user message entry
        const userMessage = {
            role: 'user',
            content: message.trim(),
            timestamp: new Date(),
            isEmergency: false
        };

        // Create assistant message entry
        const assistantMessage = {
            role: 'assistant',
            content: aiResult.response,
            timestamp: new Date(),
            isEmergency: aiResult.isEmergency
        };

        // Save both messages to the session
        chatSession.messages.push(userMessage, assistantMessage);
        await chatSession.save();

        res.status(200).json({
            sessionId,
            message: assistantMessage,
            isEmergency: aiResult.isEmergency,
            detectedKeywords: aiResult.detectedKeywords
        });
    } catch (error) {
        console.error('Chat Controller Error:', error);
        res.status(500).json({
            message: 'An unexpected error occurred. Please try again.'
        });
    }
};

/**
 * @desc    Get chat history for the authenticated user
 * @route   GET /api/chat/history
 * @access  Private
 */
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { sessionId } = req.query;

        let query = { userId };

        // If sessionId provided, return that specific session
        if (sessionId) {
            query.sessionId = sessionId;
        }

        const chatSessions = await ChatMessage.find(query)
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();

        res.status(200).json({
            sessions: chatSessions.map(session => ({
                sessionId: session.sessionId,
                messages: session.messages,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }))
        });
    } catch (error) {
        console.error('Get Chat History Error:', error);
        res.status(500).json({
            message: 'Failed to retrieve chat history.'
        });
    }
};

/**
 * @desc    Clear all chat history for the authenticated user
 * @route   DELETE /api/chat/clear
 * @access  Private
 */
const clearChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { sessionId } = req.query;

        let deleteQuery = { userId };

        // If sessionId provided, only clear that session
        if (sessionId) {
            deleteQuery.sessionId = sessionId;
        }

        const result = await ChatMessage.deleteMany(deleteQuery);

        res.status(200).json({
            message: 'Chat history cleared successfully.',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Clear Chat Error:', error);
        res.status(500).json({
            message: 'Failed to clear chat history.'
        });
    }
};

module.exports = {
    sendMessage,
    getChatHistory,
    clearChat
};
