const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requesterRole: {
        type: String,
        enum: ['doctor', 'family'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'revoked'],
        default: 'pending'
    },
    message: {
        type: String,
        default: ''
    },
    respondedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Prevent duplicate pending requests from same requester to same patient
accessRequestSchema.index({ requester: 1, patient: 1 }, { unique: true });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
