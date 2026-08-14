const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @desc    Send access request to a patient by email
// @route   POST /api/access/request
// @access  Private (Doctor/Family)
router.post('/request', protect, requireRole('doctor', 'family'), async (req, res) => {
    const { patientEmail, message } = req.body;

    if (!patientEmail) {
        return res.status(400).json({ message: 'Patient email is required' });
    }

    try {
        // Find the patient by email
        const patient = await User.findOne({ email: patientEmail });

        if (!patient) {
            return res.status(404).json({ message: 'No patient found with this email address' });
        }

        if (patient.role !== 'elder') {
            return res.status(400).json({ message: 'The specified user is not registered as a patient' });
        }

        if (patient._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot send an access request to yourself' });
        }

        // Check if request already exists
        const existingRequest = await AccessRequest.findOne({
            requester: req.user._id,
            patient: patient._id
        });

        if (existingRequest) {
            if (existingRequest.status === 'accepted') {
                return res.status(400).json({ message: 'You already have access to this patient' });
            }
            if (existingRequest.status === 'pending') {
                return res.status(400).json({ message: 'You already have a pending request for this patient' });
            }
            // If rejected or revoked, allow re-request by updating the existing record
            existingRequest.status = 'pending';
            existingRequest.message = message || '';
            existingRequest.respondedAt = undefined;
            await existingRequest.save();

            // Log activity
            await ActivityLog.create({
                actor: req.user._id,
                patient: patient._id,
                action: 'access_requested',
                description: `${req.user.fullName} (${req.user.role}) re-requested access to ${patient.fullName}'s profile`
            });

            return res.status(200).json(existingRequest);
        }

        // Create new request
        const accessRequest = await AccessRequest.create({
            requester: req.user._id,
            patient: patient._id,
            requesterRole: req.user.role,
            message: message || '',
            status: 'pending'
        });

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: patient._id,
            action: 'access_requested',
            description: `${req.user.fullName} (${req.user.role}) requested access to ${patient.fullName}'s profile`
        });

        const populated = await AccessRequest.findById(accessRequest._id)
            .populate('requester', 'fullName email role')
            .populate('patient', 'fullName email role');

        res.status(201).json(populated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Access request already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all requests sent by current user (Doctor/Family)
// @route   GET /api/access/my-requests
// @access  Private (Doctor/Family)
router.get('/my-requests', protect, requireRole('doctor', 'family'), async (req, res) => {
    try {
        const requests = await AccessRequest.find({ requester: req.user._id })
            .populate('patient', 'fullName email role')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get incoming access requests for current patient
// @route   GET /api/access/incoming
// @access  Private (Patient/Admin)
router.get('/incoming', protect, async (req, res) => {
    try {
        let query;
        if (req.user.role === 'admin') {
            // Admin can see all pending requests
            query = { status: 'pending' };
        } else {
            query = { patient: req.user._id };
        }

        const requests = await AccessRequest.find(query)
            .populate('requester', 'fullName email role')
            .populate('patient', 'fullName email role')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Respond to an access request (Accept/Reject)
// @route   PUT /api/access/:id/respond
// @access  Private (Patient/Admin)
router.put('/:id/respond', protect, async (req, res) => {
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Action must be "accept" or "reject"' });
    }

    try {
        const request = await AccessRequest.findById(req.params.id)
            .populate('requester', 'fullName email role')
            .populate('patient', 'fullName email role');

        if (!request) {
            return res.status(404).json({ message: 'Access request not found' });
        }

        // Only the patient or admin can respond
        if (req.user.role !== 'admin' && request.patient._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the patient or admin can respond to this request' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `This request has already been ${request.status}` });
        }

        request.status = action === 'accept' ? 'accepted' : 'rejected';
        request.respondedAt = new Date();
        await request.save();

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: request.patient._id,
            action: action === 'accept' ? 'access_granted' : 'access_denied',
            description: `${request.patient.fullName} ${action === 'accept' ? 'accepted' : 'rejected'} access request from ${request.requester.fullName}`
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Revoke access (Patient/Admin only)
// @route   PUT /api/access/:id/revoke
// @access  Private (Patient/Admin)
router.put('/:id/revoke', protect, async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id)
            .populate('requester', 'fullName email role')
            .populate('patient', 'fullName email role');

        if (!request) {
            return res.status(404).json({ message: 'Access request not found' });
        }

        // Only patient or admin can revoke
        if (req.user.role !== 'admin' && request.patient._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the patient or admin can revoke access' });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({ message: 'Can only revoke accepted access' });
        }

        request.status = 'revoked';
        request.respondedAt = new Date();
        await request.save();

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: request.patient._id,
            action: 'access_revoked',
            description: `${req.user.fullName} revoked ${request.requester.fullName}'s access`
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all connected patients (accepted links) for current doctor/family
// @route   GET /api/access/connected-patients
// @access  Private (Doctor/Family)
router.get('/connected-patients', protect, requireRole('doctor', 'family', 'admin'), async (req, res) => {
    try {
        let query;
        if (req.user.role === 'admin') {
            query = { status: 'accepted' };
        } else {
            query = { requester: req.user._id, status: 'accepted' };
        }

        const connections = await AccessRequest.find(query)
            .populate('patient', 'fullName email role createdAt')
            .populate('requester', 'fullName email role')
            .sort({ updatedAt: -1 });
        res.json(connections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all caregivers (doctors/family) linked to current patient
// @route   GET /api/access/my-caregivers
// @access  Private (Patient)
router.get('/my-caregivers', protect, async (req, res) => {
    try {
        const caregivers = await AccessRequest.find({
            patient: req.user._id,
            status: 'accepted'
        })
            .populate('requester', 'fullName email role createdAt')
            .sort({ updatedAt: -1 });
        res.json(caregivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
