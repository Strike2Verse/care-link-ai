const jwt = require('jsonwebtoken');
const User = require('../models/User');


const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

// Middleware: require specific role(s)
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });
        }
        next();
    };
};

// Middleware: check if current user has accepted access to target patient
const canAccessPatient = async (req, res, next) => {
    const AccessRequest = require('../models/AccessRequest');
    const patientId = req.params.patientId || req.body.patientId;

    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Patient can always access their own data
    if (req.user._id.toString() === patientId) {
        return next();
    }

    // Admin can access all
    if (req.user.role === 'admin') {
        return next();
    }

    try {
        const accessLink = await AccessRequest.findOne({
            requester: req.user._id,
            patient: patientId,
            status: 'accepted'
        });

        if (!accessLink) {
            return res.status(403).json({ message: 'You do not have access to this patient profile' });
        }

        // Attach the access link for downstream use (role checking in routes)
        req.accessLink = accessLink;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect, admin, requireRole, canAccessPatient };
