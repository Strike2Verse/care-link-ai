import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, X } from 'lucide-react';

const EmergencyAlert = ({ detectedKeywords = [], onDismiss }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="mx-3 mt-2 mb-1"
        >
            <div className="relative overflow-hidden rounded-xl border-2 border-red-400/60 bg-gradient-to-r from-red-50 via-red-50 to-orange-50 p-4 shadow-lg">
                {/* Animated pulse border effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-red-400 animate-pulse opacity-40 pointer-events-none" />

                {/* Top row: icon + title + dismiss */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-800 tracking-wide uppercase">
                                Emergency Alert
                            </h4>
                            <p className="text-xs text-red-600 mt-0.5">
                                Critical symptoms detected
                            </p>
                        </div>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 p-1 rounded-full hover:bg-red-100 transition-colors"
                            aria-label="Dismiss alert"
                        >
                            <X className="w-4 h-4 text-red-500" />
                        </button>
                    )}
                </div>

                {/* Message */}
                <p className="text-sm text-red-700 leading-relaxed mb-3 pl-11">
                    If you are experiencing a medical emergency, please <strong>call emergency services immediately</strong>.
                    Do not rely on AI assistance for emergency situations.
                </p>

                {/* Emergency numbers */}
                <div className="flex flex-wrap gap-2 pl-11 mb-2">
                    <a
                        href="tel:911"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow hover:bg-red-600 transition-colors"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Call 911
                    </a>
                    <a
                        href="tel:112"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow hover:bg-red-600 transition-colors"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Call 112
                    </a>
                    <a
                        href="tel:108"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-full shadow hover:bg-orange-600 transition-colors"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Ambulance (108)
                    </a>
                </div>

                {/* Detected keywords */}
                {detectedKeywords.length > 0 && (
                    <div className="pl-11 mt-2">
                        <p className="text-xs text-red-500">
                            Detected: {detectedKeywords.join(', ')}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default EmergencyAlert;
