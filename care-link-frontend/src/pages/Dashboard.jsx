import React, { useState, useEffect } from 'react';
import api, { getStoredUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = getStoredUser();

    const [healthStats, setHealthStats] = useState([]);
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Vitals Modal state
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [vitalForm, setVitalForm] = useState({ type: 'Heart Rate', value: '' });
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // QR Code Modal state
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [loadingQR, setLoadingQR] = useState(false);
    const [errorQR, setErrorQR] = useState('');
    const [patientId, setPatientId] = useState('');
    const [localIp, setLocalIp] = useState('localhost');

    useEffect(() => {
        fetchVitals();
        fetchMedications();
        if (user?.role === 'elder') {
            fetchPatientSummary();
        }
    }, []);

    // Generate local QR Code whenever patientId or localIp changes
    useEffect(() => {
        if (patientId) {
            const generateQRImage = async () => {
                try {
                    const url = `http://${localIp}:5005/api/patient-data/public-report/${patientId}/pdf`;
                    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
                    setQrCodeDataUrl(dataUrl);
                } catch (err) {
                    console.error('Error generating local QR code image:', err);
                }
            };
            generateQRImage();
        }
    }, [patientId, localIp]);

    const fetchPatientSummary = async () => {
        try {
            const { data } = await api.get('/patient-data/me/summary');
            if (data?.patient) {
                setPatientId(data.patient._id);
            }
            if (data?.localIp) {
                setLocalIp(data.localIp);
            }
        } catch (error) {
            console.error('Error fetching patient summary:', error);
        }
    };
    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>CareLink Patient QR Card</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 40px;
                            color: #333;
                        }
                        .card {
                            border: 3px solid #2563eb;
                            border-radius: 20px;
                            padding: 30px;
                            max-width: 400px;
                            margin: 0 auto;
                            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                        }
                        .header {
                            background-color: #2563eb;
                            color: white;
                            padding: 10px;
                            border-radius: 10px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        .qr-code {
                            margin: 20px 0;
                        }
                        .patient-name {
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        .instructions {
                            font-size: 12px;
                            color: #666;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="header">👤 Patient QR Code</div>
                        <div class="patient-name">${user.fullName || user.name}</div>
                        <div>Role: Elder Patient</div>
                        <div class="qr-code">
                            <img src="${qrCodeDataUrl}" alt="CareLink QR Code" width="200" height="200" />
                        </div>
                        <div class="instructions">
                            Scan this QR code with a smartphone to download a PDF containing the patient's health summary and records.
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadQR = () => {
        const a = document.createElement('a');
        a.href = qrCodeDataUrl;
        a.download = `CareLink-QR-${user.fullName || user.name || 'Patient'}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const fetchVitals = async () => {
        try {
            const { data } = await api.get('/dashboard/stats');

            // Filter to get the latest entry for each distinct type
            const latestByType = {};
            if (Array.isArray(data)) {
                data.forEach(vital => {
                    if (!latestByType[vital.type]) {
                        latestByType[vital.type] = vital;
                    }
                });
            }

            const statsConfig = {
                'Heart Rate': { icon: '❤️', color: 'text-red-500', bg: 'bg-red-50', defaultVal: '--' },
                'Blood Pressure': { icon: '🩺', color: 'text-blue-500', bg: 'bg-blue-50', defaultVal: '--' },
                'Glucose': { icon: '🩸', color: 'text-pink-500', bg: 'bg-pink-50', defaultVal: '--' },
                'Sleep': { icon: '😴', color: 'text-purple-500', bg: 'bg-purple-50', defaultVal: '--' }
            };

            const formattedStats = Object.keys(statsConfig).map(type => {
                const config = statsConfig[type];
                const vital = latestByType[type];
                return {
                    label: type,
                    value: vital ? vital.value : config.defaultVal,
                    status: vital ? vital.status : 'No Data',
                    icon: config.icon,
                    color: config.color,
                    bg: config.bg
                };
            });

            setHealthStats(formattedStats);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching vitals:', error);
            setLoading(false);
        }
    };

    const fetchMedications = async () => {
        try {
            const { data } = await api.get('/medications');
            setMedications(data);
        } catch (error) {
            console.error('Error fetching medications:', error);
        }
    };

    const handleMarkTaken = async (id, currentStatus) => {
        try {
            await api.put(`/medications/${id}`, { isTaken: true });
            fetchMedications(); // Refresh list
        } catch (error) {
            alert('Failed to update medication status');
        }
    };

    const getVitalStatus = (type, value) => {
        if (!value) return 'Normal';

        // Remove units and extra characters to parse numeric values
        const cleanVal = value.toString().replace(/[^\d/.]/g, '').trim();

        if (type === 'Heart Rate') {
            const hr = parseInt(cleanVal, 10);
            if (isNaN(hr)) return 'Normal';
            if (hr < 50 || hr > 120) return 'Critical';
            if (hr < 60 || hr > 100) return 'Warning';
            if (hr >= 60 && hr <= 85) return 'Good';
            return 'Normal';
        }

        if (type === 'Blood Pressure') {
            const parts = cleanVal.split('/');
            const sys = parseInt(parts[0], 10);
            const dia = parts[1] ? parseInt(parts[1], 10) : 80;
            if (isNaN(sys)) return 'Normal';

            if (sys >= 140 || dia >= 90 || sys < 90 || dia < 60) return 'Critical';
            if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return 'Warning';
            if (sys < 120 && dia < 80) return 'Good';
            return 'Normal';
        }

        if (type === 'Glucose') {
            const glu = parseInt(cleanVal, 10);
            if (isNaN(glu)) return 'Normal';
            if (glu < 70 || glu >= 126) return 'Critical';
            if (glu >= 100 && glu < 126) return 'Warning';
            return 'Good';
        }

        if (type === 'Sleep') {
            const hr = parseFloat(cleanVal);
            if (isNaN(hr)) return 'Normal';
            if (hr < 4 || hr > 12) return 'Critical';
            if (hr < 6 || hr > 9) return 'Warning';
            if (hr >= 7 && hr <= 9) return 'Good';
            return 'Normal';
        }

        return 'Normal';
    };

    const handleSaveVital = async (e) => {
        e.preventDefault();
        const { type, value } = vitalForm;
        if (!value.trim()) {
            setErrorMessage('Please enter a value');
            return;
        }

        // Validations
        if (type === 'Blood Pressure') {
            const bpRegex = /^\d{2,3}\/\d{2,3}$/;
            if (!bpRegex.test(value.trim())) {
                setErrorMessage('Blood Pressure must be in systolic/diastolic format (e.g., 120/80)');
                return;
            }
        } else {
            const numVal = parseFloat(value.trim());
            if (isNaN(numVal) || numVal <= 0) {
                setErrorMessage('Please enter a valid positive number');
                return;
            }
        }

        setSubmitting(true);
        setErrorMessage('');

        try {
            // Determine clinical status
            const status = getVitalStatus(type, value);

            // Determine unit
            let processedValue = value.trim();
            let unit = '';
            if (type === 'Heart Rate') unit = 'bpm';
            else if (type === 'Blood Pressure') unit = 'mmHg';
            else if (type === 'Glucose') unit = 'mg/dL';
            else if (type === 'Sleep') unit = 'hrs';

            if (unit && !processedValue.toLowerCase().endsWith(unit.toLowerCase())) {
                processedValue = `${processedValue} ${unit}`;
            }

            await api.post('/dashboard/stats', {
                type,
                value: processedValue,
                status
            });

            setShowVitalsModal(false);
            setVitalForm({ type: 'Heart Rate', value: '' });
            fetchVitals(); // Refresh
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Failed to save vital reading');
        } finally {
            setSubmitting(false);
        }
    };

    const todayMeds = [
        { name: 'Metformin', dose: '500mg', time: '08:00 AM', taken: true, type: '💊' },
        { name: 'Lisinopril', dose: '10mg', time: '08:00 AM', taken: true, type: '💊' },
        { name: 'Atorvastatin', dose: '20mg', time: '09:00 PM', taken: false, type: '💊' },
    ];

    const stockAlerts = medications
        .filter(med => med.stock < 7)
        .map(med => ({
            title: 'Prescription Refill',
            desc: `${med.name} is running low (${med.stock} left)`,
            time: 'Action Required',
            type: 'warning'
        }));

    const alerts = [
        { title: 'Upcoming Appointment', desc: 'Dr. Smith - Cardiology Checkup', time: 'Tomorrow, 10:00 AM', type: 'info' },
        ...stockAlerts
    ];

    const quickActions = [
        { label: 'Add Vitals', icon: '❤️', path: '/dashboard', color: 'bg-blue-600' },
        { label: 'Upload Report', icon: '📄', path: '/dashboard/vault', color: 'bg-green-600' },
        { label: 'Add Meds', icon: '💊', path: '/dashboard/medications', color: 'bg-purple-600' },
        { label: 'SOS Emergency', icon: '🚨', path: '/dashboard/sos', color: 'bg-red-600 animate-pulse' },
    ];

    if (user?.role === 'admin') {
        quickActions.unshift({ label: 'Admin Panel', icon: '⚙️', path: '/dashboard/admin', color: 'bg-gray-800' });
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-card">
                <h2 className="text-3xl font-bold mb-2">Hello, {user?.name || 'User'}! 👋</h2>
                <p className="text-blue-100 text-lg">
                    {medications.filter(m => !m.isTaken).length > 0
                        ? `You have ${medications.filter(m => !m.isTaken).length} doses remaining for today.`
                        : "All caught up! You've taken all your medications for today."}
                </p>
            </div>

            {/* Quick Actions (Mobile/Tablet prioritized) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (action.label === 'Add Vitals') {
                                setVitalForm({ type: 'Heart Rate', value: '' });
                                setErrorMessage('');
                                setShowVitalsModal(true);
                            } else {
                                navigate(action.path);
                            }
                        }}
                        className={`${action.color} text-white p-4 rounded-xl shadow-soft hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center gap-2 group`}
                    >
                        <span className="text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
                        <span className="font-semibold text-sm md:text-base">{action.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Health & Meds */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Health Stats */}
                    <div className="bg-white rounded-2xl p-6 shadow-card">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="text-2xl">📊</span> Vitals Summary
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {healthStats.map((stat, index) => (
                                <div key={index} className={`${stat.bg} p-4 rounded-xl text-center flex flex-col justify-between min-h-[140px]`}>
                                    <div>
                                        <div className={`text-3xl mb-2 ${stat.color}`}>{stat.icon}</div>
                                        <div className="text-2xl font-bold text-slate-800 truncate" title={stat.value}>{stat.value}</div>
                                        <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                                    </div>
                                    <div className={`text-xs mt-2 font-semibold px-2 py-0.5 rounded-full inline-block self-center ${stat.status === 'Good' ? 'text-emerald-700 bg-emerald-50' :
                                        stat.status === 'Normal' ? 'text-green-700 bg-green-50' :
                                            stat.status === 'Warning' ? 'text-amber-700 bg-amber-50' :
                                                stat.status === 'Critical' ? 'text-rose-700 bg-rose-50 font-bold animate-pulse' :
                                                    'text-slate-500 bg-slate-50'
                                        }`}>{stat.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Today's Medications */}
                    <div className="bg-white rounded-2xl p-6 shadow-card">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-2xl">💊</span> Today's Schedule
                            </h3>
                            <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">View All</button>
                        </div>
                        <div className="space-y-4">
                            {medications.length > 0 ? medications.map((med, index) => (
                                <div key={med._id || index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl
                                            ${med.isTaken ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            💊
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{med.name} <span className="text-xs text-gray-500 ml-1">({med.dosage || med.dose})</span></h4>
                                            <p className="text-sm text-gray-500">Scheduled for {med.time}</p>
                                        </div>
                                    </div>
                                    {med.isTaken ? (
                                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-green-200 flex items-center gap-1 cursor-default">
                                            🔒 Taken
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleMarkTaken(med._id, med.isTaken)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Mark Taken
                                        </button>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    No medications scheduled for today.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Alerts & Profile */}
                <div className="space-y-8">
                    {/* Alerts */}
                    <div className="bg-white rounded-2xl p-6 shadow-card">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="text-2xl">🔔</span> Notifications
                        </h3>
                        <div className="space-y-4">
                            {alerts.map((alert, index) => (
                                <div key={index} className={`p-4 rounded-xl border-l-4 ${alert.type === 'warning' ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-500'}`}>
                                    <h4 className="font-bold text-slate-800 mb-1">{alert.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{alert.desc}</p>
                                    <p className="text-xs text-gray-500 font-medium">{alert.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Access Card */}
                    {/* Only show for family/admin */}
                    {(user?.role === 'admin' || user?.role === 'family' || user?.role === 'doctor') && (
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-card">
                            <h3 className="text-xl font-bold mb-4">Family Access</h3>
                            <p className="text-purple-100 mb-6">Manage settings and permissions for connected profiles.</p>
                            <button onClick={() => navigate('/dashboard/family-access')} className="w-full bg-white text-purple-700 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors">
                                Manage Family
                            </button>
                        </div>
                    )}

                    {/* Patient QR Card */}
                    {user?.role === 'elder' && (
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-card relative overflow-hidden">
                            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-9xl opacity-10 font-bold select-none pointer-events-none">👤</div>
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <span>📱</span> Patient QR Profile
                            </h3>
                            <p className="text-blue-100 text-sm mb-6">
                                View your patient QR code. Anyone can scan this to get a quick summary of your vitals and health records count.
                            </p>
                            <button
                                onClick={() => {
                                    setShowQRModal(true);
                                }}
                                className="w-full bg-white text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-soft"
                            >
                                View Patient QR Code
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Vitals Entry Modal */}
            {showVitalsModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowVitalsModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full relative z-10 border border-slate-100 transform transition-all scale-100 p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-2xl">📈</span> Add Vital Reading
                            </h3>
                            <button
                                onClick={() => setShowVitalsModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-semibold focus:outline-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveVital} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Vital Type
                                </label>
                                <select
                                    value={vitalForm.type}
                                    onChange={(e) => {
                                        setVitalForm({ ...vitalForm, type: e.target.value, value: '' });
                                        setErrorMessage('');
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                                >
                                    <option value="Heart Rate">Heart Rate (bpm)</option>
                                    <option value="Blood Pressure">Blood Pressure (mmHg)</option>
                                    <option value="Glucose">Glucose (mg/dL)</option>
                                    <option value="Sleep">Sleep (hrs)</option>
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Reading Value
                                    </label>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                                        {vitalForm.type === 'Heart Rate' && 'bpm'}
                                        {vitalForm.type === 'Blood Pressure' && 'mmHg'}
                                        {vitalForm.type === 'Glucose' && 'mg/dL'}
                                        {vitalForm.type === 'Sleep' && 'hours'}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder={
                                        vitalForm.type === 'Heart Rate' ? 'e.g. 72' :
                                            vitalForm.type === 'Blood Pressure' ? 'e.g. 120/80' :
                                                vitalForm.type === 'Glucose' ? 'e.g. 95' :
                                                    'e.g. 7.5'
                                    }
                                    value={vitalForm.value}
                                    onChange={(e) => {
                                        setVitalForm({ ...vitalForm, value: e.target.value });
                                        setErrorMessage('');
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                {vitalForm.type === 'Blood Pressure' && (
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                        Enter systolic over diastolic pressure separated by a slash (e.g., 120/80)
                                    </p>
                                )}
                            </div>

                            {errorMessage && (
                                <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <span>⚠️</span> {errorMessage}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowVitalsModal(false)}
                                    className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-soft hover:shadow-lg transition-all focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Saving...' : 'Save Reading'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Emergency QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowQRModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full relative z-10 border border-slate-100 transform transition-all scale-100 p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span>📱</span> Patient QR Profile
                            </h3>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-semibold focus:outline-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-6 text-center">
                            <p className="text-slate-600 text-sm leading-relaxed text-left">
                                This QR Code links to your portable medical report PDF. Scanning it with a smartphone will directly download a summary of your vitals, documents count, and medications list.
                            </p>

                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl inline-block">
                                {qrCodeDataUrl ? (
                                    <img
                                        src={qrCodeDataUrl}
                                        alt="Patient QR Code"
                                        className="mx-auto shadow-md rounded-lg"
                                        width="200"
                                        height="200"
                                    />
                                ) : (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-400">
                                        Generating QR Code...
                                    </div>
                                )}
                                <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Public Profile Access
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handlePrintQR}
                                    className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-soft transition-colors flex items-center justify-center gap-2"
                                >
                                    🖨️ Print QR
                                </button>
                                <button
                                    onClick={handleDownloadQR}
                                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-slate-200"
                                >
                                    💾 Download PNG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
