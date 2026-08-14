const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true, // e.g., 'Heart Rate', 'Blood Pressure', 'Glucose'
    },
    value: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Normal', 'Good', 'Warning', 'Critical'],
        default: 'Normal'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Vitals', vitalsSchema);
