import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatMessage = ({ message, userName }) => {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex gap-2.5 px-4 py-2 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
                {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">
                            {getInitials(userName)}
                        </span>
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                        <Bot className="w-4.5 h-4.5 text-white" />
                    </div>
                )}
            </div>

            {/* Message Bubble */}
            <div className={`relative max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                        ${isUser
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-md'
                            : `bg-white border border-slate-100 text-slate-700 rounded-tl-md 
                               ${message.isEmergency ? 'border-red-300 bg-red-50/50' : ''}`
                        }`}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <div className="markdown-body">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                                    h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-slate-800">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 text-slate-800">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-slate-800">{children}</h3>,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Timestamp + Copy */}
                <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-slate-400">
                        {formatTime(message.timestamp)}
                    </span>
                    {!isUser && (
                        <button
                            onClick={handleCopy}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-100"
                            title={copied ? 'Copied!' : 'Copy message'}
                        >
                            {copied ? (
                                <Check className="w-3 h-3 text-green-500" />
                            ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ChatMessage;
