const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Report', 'Lab', 'Prescription', 'Record'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    doctor: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        default: ''
    },
    originalName: {
        type: String,
        default: ''
    },
    mimeType: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: '0 KB'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
