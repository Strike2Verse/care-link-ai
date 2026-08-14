const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isEmergency: {
        type: Boolean,
        default: false
    }
});

const chatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    messages: [messageSchema],
}, {
    timestamps: true
});

// Compound index for efficient lookups
chatMessageSchema.index({ userId: 1, sessionId: 1 });
chatMessageSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
