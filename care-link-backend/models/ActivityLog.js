const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
        // e.g. 'added_medication', 'marked_taken', 'uploaded_report',
        // 'added_prescription', 'access_granted', 'access_revoked',
        // 'added_reminder', 'viewed_profile'
    },
    description: {
        type: String,
        required: true
        // Human-readable: "Dr. Shah added a prescription"
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Extra data: { medicationName: 'Aspirin', dosage: '500mg' }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast lookups
activityLogSchema.index({ patient: 1, createdAt: -1 });
activityLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
