import React from 'react';
import { motion } from 'framer-motion';
import {
    Pill, Salad, Siren, Brain, HeartPulse,
    ClipboardList, Hospital, Stethoscope
} from 'lucide-react';

const QUICK_PROMPTS = [
    {
        icon: Pill,
        label: 'Medicine side effects',
        message: 'Can you tell me about common medicine side effects and how to manage them?',
        color: 'from-violet-500 to-purple-600',
        bgHover: 'hover:bg-violet-50'
    },
    {
        icon: Salad,
        label: 'Healthy diet tips',
        message: 'What are some healthy diet tips for maintaining good overall health?',
        color: 'from-emerald-500 to-green-600',
        bgHover: 'hover:bg-emerald-50'
    },
    {
        icon: Siren,
        label: 'Emergency contacts',
        message: 'What are the important emergency contact numbers and when should I call them?',
        color: 'from-red-500 to-rose-600',
        bgHover: 'hover:bg-red-50'
    },
    {
        icon: Brain,
        label: 'Stress management',
        message: 'What are effective stress management techniques for better mental health?',
        color: 'from-amber-500 to-orange-600',
        bgHover: 'hover:bg-amber-50'
    },
    {
        icon: HeartPulse,
        label: 'Blood pressure guidance',
        message: 'Can you explain blood pressure readings and how to maintain healthy blood pressure?',
        color: 'from-pink-500 to-rose-600',
        bgHover: 'hover:bg-pink-50'
    },
    {
        icon: ClipboardList,
        label: 'Explain prescription',
        message: 'Help me understand my prescription. What should I know about medication instructions?',
        color: 'from-cyan-500 to-teal-600',
        bgHover: 'hover:bg-cyan-50'
    },
    {
        icon: Hospital,
        label: 'Find nearby hospitals',
        message: 'How can I find nearby hospitals and clinics for medical assistance?',
        color: 'from-blue-500 to-indigo-600',
        bgHover: 'hover:bg-blue-50'
    },
    {
        icon: Stethoscope,
        label: 'Doctor consultation',
        message: 'When should I consult a doctor? What symptoms need immediate medical attention?',
        color: 'from-teal-500 to-emerald-600',
        bgHover: 'hover:bg-teal-50'
    },
];

const QuickPrompts = ({ onSelectPrompt }) => {
    return (
        <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                Suggested Topics
            </p>
            <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((prompt, index) => {
                    const IconComponent = prompt.icon;
                    return (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            onClick={() => onSelectPrompt(prompt.message)}
                            className={`group flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 
                                bg-white ${prompt.bgHover} transition-all duration-200 text-left
                                hover:border-slate-200 hover:shadow-md active:scale-[0.97]`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${prompt.color} 
                                flex items-center justify-center shadow-sm`}>
                                <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 leading-tight">
                                {prompt.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickPrompts;
