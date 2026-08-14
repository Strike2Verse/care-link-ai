import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Send, Bot, Sparkles, ShieldAlert, Lock, LogIn } from 'lucide-react';
import ChatMessage from './ChatMessage';
import QuickPrompts from './QuickPrompts';
import EmergencyAlert from './EmergencyAlert';
import { sendChatMessage, getChatHistory, clearChatHistory } from '../../services/chatService';
import { getStoredUser } from '../../services/api';

// Generate a simple session ID
const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

const ChatWindow = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(() => {
        const storedUser = getStoredUser();
        const userEmail = storedUser?.email || 'guest';
        return localStorage.getItem(`careLinkChatSessionId_${userEmail}`) || generateSessionId();
    });
    const [showEmergency, setShowEmergency] = useState(false);
    const [emergencyKeywords, setEmergencyKeywords] = useState([]);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [activeUserEmail, setActiveUserEmail] = useState('');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Get current user info
    const user = getStoredUser();
    const userName = user?.fullName || 'User';
    const isAuthenticated = !!user?.token;

    // Track active user changes (login, logout, switch user)
    useEffect(() => {
        const currentUser = getStoredUser();
        const currentUserEmail = currentUser?.email || '';

        if (!currentUser || !currentUser.token) {
            // Not authenticated
            if (messages.length > 0) {
                setMessages([]);
            }
            if (isHistoryLoaded) {
                setIsHistoryLoaded(false);
            }
            if (activeUserEmail !== '') {
                setActiveUserEmail('');
            }
            // Use temporary guest session ID
            const guestSession = generateSessionId();
            setSessionId(guestSession);
        } else if (currentUserEmail !== activeUserEmail) {
            // User logged in or changed
            setMessages([]);
            setIsHistoryLoaded(false);
            setActiveUserEmail(currentUserEmail);

            const userSessionKey = `careLinkChatSessionId_${currentUserEmail}`;
            const storedSessionId = localStorage.getItem(userSessionKey);
            if (storedSessionId) {
                setSessionId(storedSessionId);
            } else {
                const newSession = generateSessionId();
                localStorage.setItem(userSessionKey, newSession);
                setSessionId(newSession);
            }
        }
    }, [isOpen, activeUserEmail, messages.length, isHistoryLoaded]);

    // Save sessionId to localStorage for user isolation
    useEffect(() => {
        if (activeUserEmail) {
            localStorage.setItem(`careLinkChatSessionId_${activeUserEmail}`, sessionId);
        }
        localStorage.setItem('careLinkChatSessionId', sessionId);
    }, [sessionId, activeUserEmail]);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    // Focus input when window opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, [isOpen]);

    // Load chat history on mount/open for active authenticated user
    useEffect(() => {
        if (isOpen && isAuthenticated && !isHistoryLoaded && activeUserEmail) {
            loadHistory();
        }
    }, [isOpen, isAuthenticated, isHistoryLoaded, activeUserEmail]);

    const loadHistory = async () => {
        try {
            const response = await getChatHistory(sessionId);
            const sessions = response.data?.sessions || [];
            if (sessions.length > 0) {
                // Use the most recent session's messages
                const latestSession = sessions[0];
                setMessages(latestSession.messages || []);
                if (latestSession.sessionId) {
                    setSessionId(latestSession.sessionId);
                }
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        } finally {
            setIsHistoryLoaded(true);
        }
    };

    const handleSend = async (messageText) => {
        const text = (messageText || inputValue).trim();
        if (!text || isLoading) return;

        if (!isAuthenticated) {
            onClose();
            navigate('/auth?mode=login');
            return;
        }

        // Add user message immediately
        const userMsg = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
            isEmergency: false
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await sendChatMessage(text, sessionId);
            const data = response.data;

            // Update sessionId if server provides one
            if (data.sessionId) {
                setSessionId(data.sessionId);
            }

            // Add bot response
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.message.content,
                timestamp: data.message.timestamp,
                isEmergency: data.isEmergency
            }]);

            // Handle emergency
            if (data.isEmergency) {
                setShowEmergency(true);
                setEmergencyKeywords(data.detectedKeywords || []);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = error.response?.data?.message || 'Sorry, I encountered an error. Please try again.';
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ ${errorMessage}`,
                timestamp: new Date().toISOString(),
                isEmergency: false
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = async () => {
        try {
            if (isAuthenticated) {
                await clearChatHistory(sessionId);
            }
            setMessages([]);
            setShowEmergency(false);
            setEmergencyKeywords([]);
            setShowClearConfirm(false);
            // Create a fresh session
            const newSessionId = generateSessionId();
            setSessionId(newSessionId);
        } catch (error) {
            console.error('Failed to clear chat:', error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Typing indicator component
    const TypingIndicator = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-2.5 px-4 py-2"
        >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
                <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                    <div className="typing-dot w-2 h-2 bg-slate-400 rounded-full" style={{ animationDelay: '0ms' }} />
                    <div className="typing-dot w-2 h-2 bg-slate-400 rounded-full" style={{ animationDelay: '150ms' }} />
                    <div className="typing-dot w-2 h-2 bg-slate-400 rounded-full" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-[998]"
                    />

                    {/* Chat drawer */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0.5 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full z-[999] 
                            w-[90vw] sm:w-[70vw] md:w-[420px] lg:w-[440px]
                            flex flex-col bg-gradient-to-b from-slate-50 to-white
                            md:rounded-l-2xl shadow-2xl overflow-hidden"
                    >
                        {/* ═══════════ HEADER ═══════════ */}
                        <div className="relative flex-shrink-0">
                            {/* Gradient header background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-60" />
                            
                            <div className="relative px-4 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-base tracking-tight">
                                            AI Health Assistant
                                        </h2>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-white/70 text-xs">Online • CareLink AI</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Clear chat button */}
                                    {messages.length > 0 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowClearConfirm(!showClearConfirm)}
                                                className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                                                title="Clear chat"
                                            >
                                                <Trash2 className="w-4.5 h-4.5 text-white/80" />
                                            </button>
                                            {/* Clear confirmation dropdown */}
                                            <AnimatePresence>
                                                {showClearConfirm && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50"
                                                    >
                                                        <p className="text-xs text-slate-600 mb-2">Clear all messages?</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleClearChat}
                                                                className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                                                            >
                                                                Clear
                                                            </button>
                                                            <button
                                                                onClick={() => setShowClearConfirm(false)}
                                                                className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                    {/* Close button */}
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                                        title="Close chat"
                                    >
                                        <X className="w-5 h-5 text-white/90" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ═══════════ EMERGENCY ALERT ═══════════ */}
                        <AnimatePresence>
                            {showEmergency && (
                                <EmergencyAlert
                                    detectedKeywords={emergencyKeywords}
                                    onDismiss={() => setShowEmergency(false)}
                                />
                            )}
                        </AnimatePresence>

                        {/* ═══════════ MESSAGES AREA ═══════════ */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto chatbot-scrollbar flex flex-col justify-center"
                        >
                            {!isAuthenticated ? (
                                <div className="px-6 py-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                                        AI Assistant Locked
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto mb-6">
                                        Please log in to chat with the AI Health Assistant, view your medication history, and get personalized health advice.
                                    </p>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate('/auth?mode=login');
                                        }}
                                        className="w-full max-w-[240px] py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogIn className="w-4.5 h-4.5" /> Sign In
                                    </button>
                                </div>
                            ) : messages.length === 0 && !isLoading ? (
                                <div className="flex flex-col h-full">
                                    {/* Welcome message */}
                                    <div className="px-6 pt-6 pb-4 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                            <Bot className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                                            Hi {userName.split(' ')[0]}! 👋
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                                            I'm your AI Health Assistant. Ask me about health tips, medications, symptoms, or platform navigation.
                                        </p>
                                    </div>

                                    {/* Quick prompts */}
                                    <QuickPrompts onSelectPrompt={handleSend} />
                                </div>
                            ) : (
                                <div className="py-3">
                                    {messages.map((msg, index) => (
                                        <ChatMessage
                                            key={index}
                                            message={msg}
                                            userName={userName}
                                        />
                                    ))}

                                    {/* Typing indicator */}
                                    <AnimatePresence>
                                        {isLoading && <TypingIndicator />}
                                    </AnimatePresence>

                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* ═══════════ INPUT AREA ═══════════ */}
                        {isAuthenticated && (
                            <div className="flex-shrink-0 border-t border-slate-100 bg-white">
                                {/* Disclaimer */}
                                <div className="px-4 pt-2">
                                    <div className="flex items-start gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-700 leading-tight">
                                            AI-generated responses are informational only and should not replace professional medical advice.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Input bar */}
                                <div className="p-3">
                                    <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1.5">
                                        <textarea
                                            ref={inputRef}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask about health, medications..."
                                            rows={1}
                                            className="flex-1 resize-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 
                                                px-2.5 py-2 outline-none max-h-24 overflow-y-auto leading-relaxed"
                                            style={{ minHeight: '36px' }}
                                            onInput={(e) => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                                            }}
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleSend()}
                                            disabled={!inputValue.trim() || isLoading}
                                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all
                                                ${inputValue.trim() && !isLoading
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Send className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ChatWindow;
