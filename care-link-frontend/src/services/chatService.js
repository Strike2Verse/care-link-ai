import api from './api';

/**
 * Send a chat message to the AI backend
 * @param {string} message - The user's message
 * @param {string} sessionId - The chat session ID
 * @returns {Promise} API response with AI reply
 */
export const sendChatMessage = (message, sessionId) => {
    return api.post('/chat', { message, sessionId });
};

/**
 * Get chat history for the authenticated user
 * @param {string} [sessionId] - Optional specific session ID
 * @returns {Promise} API response with chat sessions
 */
export const getChatHistory = (sessionId) => {
    const params = sessionId ? { sessionId } : {};
    return api.get('/chat/history', { params });
};

/**
 * Clear chat history
 * @param {string} [sessionId] - Optional specific session to clear
 * @returns {Promise} API response
 */
export const clearChatHistory = (sessionId) => {
    const params = sessionId ? { sessionId } : {};
    return api.delete('/chat/clear', { params });
};
