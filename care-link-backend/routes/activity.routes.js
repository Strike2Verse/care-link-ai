const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const AccessRequest = require('../models/AccessRequest');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get activity logs for a specific patient
// @route   GET /api/activity/:patientId
// @access  Private (linked users only)
router.get('/:patientId', protect, async (req, res) => {
    const { patientId } = req.params;

    try {
        // Check access: must be the patient, admin, or have accepted link
        if (req.user._id.toString() !== patientId && req.user.role !== 'admin') {
            const accessLink = await AccessRequest.findOne({
                requester: req.user._id,
                patient: patientId,
                status: 'accepted'
            });
            if (!accessLink) {
                return res.status(403).json({ message: 'You do not have access to this patient\'s activity' });
            }
        }

        const logs = await ActivityLog.find({ patient: patientId })
            .populate('actor', 'fullName email role')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get activity logs where current user is the patient
// @route   GET /api/activity/me/feed
// @access  Private
router.get('/me/feed', protect, async (req, res) => {
    try {
        const logs = await ActivityLog.find({ patient: req.user._id })
            .populate('actor', 'fullName email role')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get recent activity for all connected patients (for doctor/family dashboard)
// @route   GET /api/activity/connected/recent
// @access  Private (Doctor/Family)
router.get('/connected/recent', protect, async (req, res) => {
    try {
        // Get all patients linked to this user
        const connections = await AccessRequest.find({
            requester: req.user._id,
            status: 'accepted'
        });

        const patientIds = connections.map(c => c.patient);

        // Also include activities where this user is the actor
        const logs = await ActivityLog.find({
            $or: [
                { patient: { $in: patientIds } },
                { actor: req.user._id }
            ]
        })
            .populate('actor', 'fullName email role')
            .populate('patient', 'fullName email role')
            .sort({ createdAt: -1 })
            .limit(30);

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
