import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleHeart } from 'lucide-react';
import ChatWindow from './ChatWindow';

const ChatbotLauncher = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Chat Window */}
            <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />

            {/* Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="fixed bottom-6 right-6 z-[997]"
                    >
                        {/* Outer pulse ring */}
                        <div className="absolute inset-0 w-[60px] h-[60px] rounded-full bg-blue-500/20 animate-ping" 
                             style={{ animationDuration: '2.5s' }} />
                        
                        {/* Secondary glow ring */}
                        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-400/30 to-indigo-400/30 blur-md animate-pulse"
                             style={{ animationDuration: '3s' }} />

                        {/* Main button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsOpen(true)}
                            className="relative w-[60px] h-[60px] rounded-full 
                                bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600
                                shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                                flex items-center justify-center
                                border border-white/20
                                transition-shadow duration-300
                                group"
                            aria-label="Open AI Health Assistant"
                        >
                            {/* Glassmorphism inner highlight */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                            
                            {/* Icon */}
                            <MessageCircleHeart className="w-7 h-7 text-white relative z-10 
                                group-hover:rotate-12 transition-transform duration-300" />
                            
                            {/* Online dot */}
                            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full 
                                bg-emerald-400 border-2 border-white shadow-sm">
                                <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" 
                                     style={{ animationDuration: '2s' }} />
                            </div>
                        </motion.button>

                        {/* Tooltip */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.5 }}
                            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 
                                whitespace-nowrap px-3 py-1.5 bg-slate-800 text-white text-xs 
                                font-medium rounded-lg shadow-lg pointer-events-none
                                hidden sm:block"
                        >
                            AI Health Assistant
                            <div className="absolute left-full top-1/2 -translate-y-1/2 
                                border-4 border-transparent border-l-slate-800" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatbotLauncher;
