const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all medications for logged in user
// @route   GET /api/medications
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const medications = await Medication.find({ user: req.user._id });
        res.json(medications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add a new medication
// @route   POST /api/medications
// @access  Private
router.post('/', protect, async (req, res) => {
    const { name, dosage, frequency, time, stock } = req.body;

    try {
        const medication = new Medication({
            user: req.user._id,
            name,
            dosage,
            frequency,
            time: time || '08:00 AM',
            stock
        });

        const createdMedication = await medication.save();
        res.status(201).json(createdMedication);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update medication (mark as taken, refill, edit attributes)
// @route   PUT /api/medications/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const { name, dosage, frequency, time, stock, isTaken } = req.body;

    try {
        const medication = await Medication.findById(req.params.id);

        if (medication) {
            // Check if user owns the medication
            if (medication.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            if (name !== undefined) medication.name = name;
            if (dosage !== undefined) medication.dosage = dosage;
            if (frequency !== undefined) medication.frequency = frequency;
            if (time !== undefined) medication.time = time;
            if (stock !== undefined) medication.stock = stock;
            if (isTaken !== undefined) {
                if (medication.isTaken && isTaken === false) {
                    return res.status(400).json({ message: 'Cannot unmark a medication once taken' });
                }
                medication.isTaken = isTaken;
            }

            const updatedMedication = await medication.save();
            res.json(updatedMedication);
        } else {
            res.status(404).json({ message: 'Medication not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
