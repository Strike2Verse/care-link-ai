const express = require('express');
const router = express.Router();
const Vitals = require('../models/Vitals');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user health stats (latest for each type)
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        // This is a simplified fetch. In a real app, you might want to aggregate to get the *latest* of each type.
        // For now, we'll just return all recent vitals.
        const vitals = await Vitals.find({ user: req.user._id }).sort({ date: -1 }).limit(10);
        res.json(vitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add new vital reading
// @route   POST /api/dashboard/stats
// @access  Private
router.post('/stats', protect, async (req, res) => {
    const { type, value, status } = req.body;

    try {
        const vital = new Vitals({
            user: req.user._id,
            type,
            value,
            status
        });

        const createdVital = await vital.save();
        res.status(201).json(createdVital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
