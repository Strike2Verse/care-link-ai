const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting to MongoDB with URI:', MONGO_URI);

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes Configuration
app.get('/', (req, res) => {
    res.send('Care Link API is running...');
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const scanRoutes = require('./routes/scan.routes');
app.use('/api/auth', authRoutes);
app.use('/api/vault', require('./routes/vault.routes'));
app.use('/api/medications', require('./routes/medication.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/scan', scanRoutes);
app.use('/api/access', require('./routes/access.routes'));
app.use('/api/activity', require('./routes/activity.routes'));
app.use('/api/patient-data', require('./routes/patient-data.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
// Multer error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
