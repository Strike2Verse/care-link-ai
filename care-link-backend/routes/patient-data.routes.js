const express = require('express');
const router = express.Router();
const os = require('os');
const PDFDocument = require('pdfkit');
const Medication = require('../models/Medication');
const MedicalRecord = require('../models/MedicalRecord');
const Vitals = require('../models/Vitals');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { protect, canAccessPatient } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const crypto = require('crypto');

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// ==========================================
// PUBLIC ROUTES (must come before /:patientId routes)
// ==========================================

// @desc    Get public patient report
// @route   GET /api/patient-data/public-report/:patientId
// @access  Public
router.get('/public-report/:patientId', async (req, res) => {
    try {
        const patient = await User.findById(req.params.patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        // Fetch latest vitals for this patient
        const vitalsData = await Vitals.find({ user: patient._id }).sort({ date: -1 }).limit(20);
        const latestVitals = {};
        vitalsData.forEach(vital => {
            if (!latestVitals[vital.type]) {
                latestVitals[vital.type] = {
                    value: vital.value,
                    status: vital.status,
                    date: vital.date
                };
            }
        });

        // Fetch counts
        const documentCount = await MedicalRecord.countDocuments({ user: patient._id });
        const medicationCount = await Medication.countDocuments({ user: patient._id });

        res.json({
            fullName: patient.fullName,
            vitals: latestVitals,
            documentCount,
            medicationCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Download public patient report as PDF
// @route   GET /api/patient-data/public-report/:patientId/pdf
// @access  Public
router.get('/public-report/:patientId/pdf', async (req, res) => {
    try {
        const patient = await User.findById(req.params.patientId);
        if (!patient) {
            return res.status(404).send('Patient not found.');
        }

        // Fetch latest vitals for this patient
        const vitalsData = await Vitals.find({ user: patient._id }).sort({ date: -1 }).limit(20);
        const latestVitals = {};
        vitalsData.forEach(vital => {
            if (!latestVitals[vital.type]) {
                latestVitals[vital.type] = {
                    value: vital.value,
                    status: vital.status,
                    date: vital.date
                };
            }
        });

        // Fetch medications and document count
        const medications = await Medication.find({ user: patient._id });
        const documentCount = await MedicalRecord.countDocuments({ user: patient._id });

        // Initialize PDF Document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // HTTP Headers to trigger download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="CareLink_PatientReport_${patient.fullName.replace(/\s+/g, '_')}.pdf"`);

        doc.pipe(res);

        // --- PDF Generation Styling ---
        const primaryColor = '#0284c7'; // Sky/Blue
        const secondaryColor = '#0f172a'; // Slate dark
        const mutedColor = '#64748b'; // Slate grey

        // Header Banner
        doc.fillColor(primaryColor).rect(50, 40, 495, 60).fill();
        doc.fillColor('#ffffff').fontSize(18).text('CARELINK HEALTH PORTABLE SUMMARY', 70, 62, { align: 'left' });

        // Patient Info Section
        doc.moveDown(3.5);
        doc.fillColor(secondaryColor).fontSize(14).text('Patient Profile Info', 50, 125, { underline: true });
        doc.fontSize(11).fillColor('#000000');
        doc.text(`Full Name: ${patient.fullName || patient.name || 'Elder Patient'}`, 50, 150);
        doc.text(`Age: ${patient.age || 'N/A'} years old`, 50, 165);
        doc.text(`Role: Elder / Patient`, 50, 180);
        doc.text(`Generated At: ${new Date().toLocaleString()}`, 50, 195);

        // Document Overview
        doc.fillColor(secondaryColor).fontSize(14).text('Records Summary', 320, 125, { underline: true });
        doc.fontSize(11).fillColor('#000000');
        doc.text(`Total Medical Documents: ${documentCount}`, 320, 150);
        doc.text(`Active Medications Count: ${medications.length}`, 320, 165);

        // Divider
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 225).lineTo(545, 225).stroke();

        // Vitals Section
        doc.fillColor(primaryColor).fontSize(14).text('Recent Vitals Log', 50, 245, { underline: true });

        let yPos = 275;
        if (Object.keys(latestVitals).length > 0) {
            // Draw table header
            doc.fillColor(secondaryColor).fontSize(10).text('VITAL TYPE', 50, yPos, { bold: true });
            doc.text('CURRENT VALUE', 200, yPos, { bold: true });
            doc.text('STATUS', 330, yPos, { bold: true });
            doc.text('LAST LOGGED', 430, yPos, { bold: true });

            yPos += 15;
            doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, yPos).lineTo(545, yPos).stroke();
            yPos += 10;

            for (const [type, data] of Object.entries(latestVitals)) {
                let statusColor = '#64748b';
                if (data.status === 'Good' || data.status === 'Normal') statusColor = '#10b981';
                else if (data.status === 'Warning') statusColor = '#f59e0b';
                else if (data.status === 'Critical') statusColor = '#ef4444';

                doc.fillColor('#000000').fontSize(10).text(type, 50, yPos);
                doc.text(data.value || 'N/A', 200, yPos);

                doc.fillColor(statusColor).text(data.status || 'N/A', 330, yPos);
                doc.fillColor(mutedColor).text(new Date(data.date).toLocaleDateString(), 430, yPos);

                yPos += 20;
                doc.strokeColor('#f1f5f9').moveTo(50, yPos).lineTo(545, yPos).stroke();
                yPos += 10;
            }
        } else {
            doc.fillColor(mutedColor).fontSize(11).text('No recent vital logs found.', 50, yPos);
            yPos += 30;
        }

        // Medications Section
        yPos += 15;
        doc.fillColor(primaryColor).fontSize(14).text('Medications List', 50, yPos, { underline: true });
        yPos += 25;

        if (medications.length > 0) {
            doc.fillColor(secondaryColor).fontSize(10).text('MEDICATION NAME', 50, yPos, { bold: true });
            doc.text('DOSAGE', 200, yPos, { bold: true });
            doc.text('FREQUENCY', 320, yPos, { bold: true });
            doc.text('STATUS', 450, yPos, { bold: true });

            yPos += 15;
            doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, yPos).lineTo(545, yPos).stroke();
            yPos += 10;

            medications.forEach(med => {
                doc.fillColor('#000000').fontSize(10).text(med.name, 50, yPos);
                doc.text(med.dosage || 'N/A', 200, yPos);
                doc.text(med.frequency || 'N/A', 320, yPos);

                const statusText = med.isTaken ? 'Taken' : 'Pending';
                const statusColor = med.isTaken ? '#10b981' : '#f59e0b';
                doc.fillColor(statusColor).text(statusText, 450, yPos);

                yPos += 20;
                doc.strokeColor('#f1f5f9').moveTo(50, yPos).lineTo(545, yPos).stroke();
                yPos += 10;
            });
        } else {
            doc.fillColor(mutedColor).fontSize(11).text('No active medications registered.', 50, yPos);
        }

        // Footer
        doc.fillColor(mutedColor).fontSize(9).text('This is an automatically generated document from CareLink Patient QR Portal.', 50, 780, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error generating patient PDF report:', error);
        res.status(500).send('Error generating PDF report');
    }
});

// ==========================================
// CURRENT USER PROFILE SUMMARY & DETAILS
// ==========================================

// @desc    Get current user's profile summary
// @route   GET /api/patient-data/me/summary
// @access  Private (Elder/Patient)
router.get('/me/summary', protect, async (req, res) => {
    try {
        const patientId = req.user._id;
        const patient = await User.findById(patientId).select('-password');
        const medCount = await Medication.countDocuments({ user: patientId });
        const recordCount = await MedicalRecord.countDocuments({ user: patientId });
        const takenCount = await Medication.countDocuments({ user: patientId, isTaken: true });
        const totalMeds = await Medication.countDocuments({ user: patientId });
        const lowStockMeds = await Medication.find({ user: patientId, stock: { $lt: 7 } });

        res.json({
            patient,
            localIp: getLocalIpAddress(),
            stats: {
                totalMedications: medCount,
                totalRecords: recordCount,
                adherenceRate: totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 0,
                lowStockAlerts: lowStockMeds.map(m => ({ name: m.name, stock: m.stock }))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// MEDICATIONS - View/Add/Mark Taken
// ==========================================

// @desc    Get patient's medications
// @route   GET /api/patient-data/:patientId/medications
// @access  Private (linked doctor/family)
router.get('/:patientId/medications', protect, canAccessPatient, async (req, res) => {
    try {
        const medications = await Medication.find({ user: req.params.patientId });
        res.json(medications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add medication to patient (Doctor & Family & Patient)
// @route   POST /api/patient-data/:patientId/medications
// @access  Private (Doctor/Family with access, or patient)
router.post('/:patientId/medications', protect, canAccessPatient, async (req, res) => {
    // Only doctors, family, admins, and the patient themselves can add medications
    if (req.user.role !== 'doctor' && req.user.role !== 'family' && req.user.role !== 'admin' && req.user._id.toString() !== req.params.patientId) {
        return res.status(403).json({ message: 'Only doctor or family member can add medications to patient profiles' });
    }

    const { name, dosage, frequency, time, stock } = req.body;

    try {
        const patient = await User.findById(req.params.patientId);
        const medication = new Medication({
            user: req.params.patientId,
            name,
            dosage,
            frequency,
            time: time || '08:00 AM',
            stock: stock || 30
        });

        const created = await medication.save();

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: req.params.patientId,
            action: 'added_medication',
            description: `${req.user.fullName} added medication "${name}" for ${patient.fullName}`,
            metadata: { medicationName: name, dosage, frequency }
        });

        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Mark medication as taken (Family members & patient)
// @route   PUT /api/patient-data/:patientId/medications/:medId/taken
// @access  Private (Family with access, or patient)
router.put('/:patientId/medications/:medId/taken', protect, canAccessPatient, async (req, res) => {
    // Family members and patients can mark taken; doctors cannot
    if (req.user.role === 'doctor' && req.user._id.toString() !== req.params.patientId) {
        return res.status(403).json({ message: 'Doctors cannot mark medications as taken' });
    }

    try {
        const medication = await Medication.findById(req.params.medId);

        if (!medication) {
            return res.status(404).json({ message: 'Medication not found' });
        }

        if (medication.user.toString() !== req.params.patientId) {
            return res.status(400).json({ message: 'Medication does not belong to this patient' });
        }

        if (medication.isTaken) {
            return res.status(400).json({ message: 'Medication has already been taken' });
        }

        medication.isTaken = true;
        const updated = await medication.save();

        const patient = await User.findById(req.params.patientId);

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: req.params.patientId,
            action: 'marked_taken',
            description: `${req.user.fullName} marked "${medication.name}" as taken for ${patient.fullName}`,
            metadata: { medicationName: medication.name }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update patient's medication
// @route   PUT /api/patient-data/:patientId/medications/:medId
// @access  Private (linked doctor/family, or patient)
router.put('/:patientId/medications/:medId', protect, canAccessPatient, async (req, res) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'family' && req.user.role !== 'admin' && req.user._id.toString() !== req.params.patientId) {
        return res.status(403).json({ message: 'Not authorized to edit medications for this patient' });
    }

    const { name, dosage, frequency, time, stock, isTaken } = req.body;

    try {
        const medication = await Medication.findById(req.params.medId);

        if (!medication) {
            return res.status(404).json({ message: 'Medication not found' });
        }

        if (medication.user.toString() !== req.params.patientId) {
            return res.status(400).json({ message: 'Medication does not belong to this patient' });
        }

        if (name !== undefined) medication.name = name;
        if (dosage !== undefined) medication.dosage = dosage;
        if (frequency !== undefined) medication.frequency = frequency;
        if (time !== undefined) medication.time = time;
        if (stock !== undefined) medication.stock = stock;
        if (isTaken !== undefined) medication.isTaken = isTaken;

        const updated = await medication.save();
        const patient = await User.findById(req.params.patientId);

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: req.params.patientId,
            action: 'added_medication',
            description: `${req.user.fullName} updated medication "${medication.name}" for ${patient.fullName}`,
            metadata: { medicationName: medication.name, dosage, frequency }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete patient's medication
// @route   DELETE /api/patient-data/:patientId/medications/:medId
// @access  Private (linked doctor/family, or patient)
router.delete('/:patientId/medications/:medId', protect, canAccessPatient, async (req, res) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'family' && req.user.role !== 'admin' && req.user._id.toString() !== req.params.patientId) {
        return res.status(403).json({ message: 'Not authorized to delete medications for this patient' });
    }

    try {
        const medication = await Medication.findById(req.params.medId);

        if (!medication) {
            return res.status(404).json({ message: 'Medication not found' });
        }

        if (medication.user.toString() !== req.params.patientId) {
            return res.status(400).json({ message: 'Medication does not belong to this patient' });
        }

        await medication.deleteOne();
        const patient = await User.findById(req.params.patientId);

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: req.params.patientId,
            action: 'access_revoked',
            description: `${req.user.fullName} removed medication "${medication.name}" for ${patient.fullName}`,
            metadata: { medicationName: medication.name }
        });

        res.json({ message: 'Medication deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// MEDICAL RECORDS - View/Upload
// ==========================================

// @desc    Get patient's medical records
// @route   GET /api/patient-data/:patientId/records
// @access  Private (linked users)
router.get('/:patientId/records', protect, canAccessPatient, async (req, res) => {
    try {
        const records = await MedicalRecord.find({ user: req.params.patientId }).sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Upload report/prescription for patient (Doctor only)
// @route   POST /api/patient-data/:patientId/records
// @access  Private (Doctor with access)
router.post('/:patientId/records', protect, canAccessPatient, upload.single('file'), async (req, res) => {
    // Only doctors, admins, or the patient themselves
    if (req.user.role !== 'doctor' && req.user.role !== 'admin' && req.user._id.toString() !== req.params.patientId) {
        return res.status(403).json({ message: 'Only doctors can upload records to patient profiles' });
    }

    try {
        const { title, type, date, doctor } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const bytes = req.file.size;
        let size;
        if (bytes < 1024) size = `${bytes} B`;
        else if (bytes < 1024 * 1024) size = `${(bytes / 1024).toFixed(1)} KB`;
        else size = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

        const patient = await User.findById(req.params.patientId);

        const record = new MedicalRecord({
            user: req.params.patientId,
            title,
            type: type || 'Prescription',
            date: date || new Date(),
            doctor: doctor || req.user.fullName,
            size,
            fileUrl: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype
        });

        const created = await record.save();

        // Log activity
        await ActivityLog.create({
            actor: req.user._id,
            patient: req.params.patientId,
            action: 'uploaded_report',
            description: `${req.user.fullName} uploaded "${title}" (${type || 'Prescription'}) for ${patient.fullName}`,
            metadata: { recordTitle: title, recordType: type }
        });

        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Download patient's medical document
// @route   GET /api/patient-data/:patientId/records/:recordId/download
// @access  Private (linked users)
router.get('/:patientId/records/:recordId/download', protect, canAccessPatient, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.recordId);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        if (record.user.toString() !== req.params.patientId) {
            return res.status(400).json({ message: 'Record does not belong to this patient' });
        }

        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(__dirname, '..', 'uploads', record.fileUrl);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(filePath, record.originalName || record.title);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// VITALS - View
// ==========================================

// @desc    Get patient's vitals
// @route   GET /api/patient-data/:patientId/vitals
// @access  Private (linked users)
router.get('/:patientId/vitals', protect, canAccessPatient, async (req, res) => {
    try {
        const vitals = await Vitals.find({ user: req.params.patientId }).sort({ date: -1 }).limit(20);
        res.json(vitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// PATIENT PROFILE SUMMARY
// ==========================================

// @desc    Get patient profile summary (basic info + stats)
// @route   GET /api/patient-data/:patientId/summary
// @access  Private (linked users)
router.get('/:patientId/summary', protect, canAccessPatient, async (req, res) => {
    try {
        const patient = await User.findById(req.params.patientId).select('-password');
        const medCount = await Medication.countDocuments({ user: req.params.patientId });
        const recordCount = await MedicalRecord.countDocuments({ user: req.params.patientId });
        const takenCount = await Medication.countDocuments({ user: req.params.patientId, isTaken: true });
        const totalMeds = await Medication.countDocuments({ user: req.params.patientId });
        const lowStockMeds = await Medication.find({ user: req.params.patientId, stock: { $lt: 7 } });

        res.json({
            patient,
            stats: {
                totalMedications: medCount,
                totalRecords: recordCount,
                adherenceRate: totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 0,
                lowStockAlerts: lowStockMeds.map(m => ({ name: m.name, stock: m.stock }))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
