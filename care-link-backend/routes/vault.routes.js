const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// @desc    Get all medical records for logged in user
// @route   GET /api/vault
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const records = await MedicalRecord.find({ user: req.user._id }).sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Upload a new medical document
// @route   POST /api/vault
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        const { title, type, date, doctor } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Format file size
        const bytes = req.file.size;
        let size;
        if (bytes < 1024) size = `${bytes} B`;
        else if (bytes < 1024 * 1024) size = `${(bytes / 1024).toFixed(1)} KB`;
        else size = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

        const record = new MedicalRecord({
            user: req.user._id,
            title,
            type,
            date,
            doctor,
            size,
            fileUrl: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype
        });

        const createdRecord = await record.save();
        res.status(201).json(createdRecord);
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Download / serve a medical document file
// @route   GET /api/vault/:id/download
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        if (record.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const filePath = path.join(__dirname, '..', 'uploads', record.fileUrl);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(filePath, record.originalName || record.title);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a medical record
// @route   DELETE /api/vault/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id);

        if (record) {
            if (record.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // Delete the actual file from disk
            if (record.fileUrl) {
                const filePath = path.join(__dirname, '..', 'uploads', record.fileUrl);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            }

            await record.deleteOne();
            res.json({ message: 'Record removed' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
