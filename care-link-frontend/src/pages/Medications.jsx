import React, { useState, useEffect, useRef } from 'react';
import api, { getStoredUser } from '../services/api';
import PillScannerModal from '../components/PillScannerModal';

const Medications = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const firedRemindersRef = useRef(new Set());
    const timeoutsRef = useRef({});

    // Keep current time updated for countdown badges
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 15000); // tick every 15 seconds
        return () => clearInterval(interval);
    }, []);

    // Helper to get today's date string for fire prevention tracking across days
    const getTodayDateString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    };

    // Parse medication time like "08:00 AM", "6.00 pm", "6 pm" or "20:00" to ms relative to now
    const parseTimeToMs = (timeStr) => {
        if (!timeStr) return null;
        
        // Normalize: replace dots with colons, remove extra spaces
        let cleanStr = timeStr.trim().toUpperCase().replace(/\./g, ':');
        
        // Support formats like "6 PM" or "6PM" -> convert to "6:00 PM"
        if (/^\d{1,2}\s*(AM|PM)$/.test(cleanStr)) {
            cleanStr = cleanStr.replace(/^(\d{1,2})/, "$1:00");
        }
        
        // Match 12-hour clock (e.g., "08:00 AM" or "6:00 PM")
        const ampmMatch = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
        let hours = 0;
        let minutes = 0;
        
        if (ampmMatch) {
            hours = parseInt(ampmMatch[1], 10);
            minutes = parseInt(ampmMatch[2], 10);
            const ampm = ampmMatch[3];
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
        } else {
            // Match 24-hour clock (e.g., "18:00")
            const match24 = cleanStr.match(/^(\d{1,2}):(\d{2})$/);
            if (match24) {
                hours = parseInt(match24[1], 10);
                minutes = parseInt(match24[2], 10);
            } else {
                return null;
            }
        }
        
        const now = new Date();
        const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        
        let diff = scheduledTime.getTime() - now.getTime();
        // If it is in the past for today, automatically schedule it for tomorrow!
        if (diff < 0) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
            diff = scheduledTime.getTime() - now.getTime();
        }
        return diff;
    };

    // Calculate remaining minutes until the scheduled time for today
    const getMinutesUntilReminder = (timeStr) => {
        if (!timeStr) return null;
        let cleanStr = timeStr.trim().toUpperCase().replace(/\./g, ':');
        
        if (/^\d{1,2}\s*(AM|PM)$/.test(cleanStr)) {
            cleanStr = cleanStr.replace(/^(\d{1,2})/, "$1:00");
        }
        
        const ampmMatch = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
        let hours = 0;
        let minutes = 0;
        
        if (ampmMatch) {
            hours = parseInt(ampmMatch[1], 10);
            minutes = parseInt(ampmMatch[2], 10);
            const ampm = ampmMatch[3];
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
        } else {
            const match24 = cleanStr.match(/^(\d{1,2}):(\d{2})$/);
            if (match24) {
                hours = parseInt(match24[1], 10);
                minutes = parseInt(match24[2], 10);
            } else {
                return null;
            }
        }
        
        const now = currentTime;
        const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        const diff = scheduledTime.getTime() - now.getTime();
        
        if (diff <= 0) return null; // Passed for today
        return Math.ceil(diff / 60000);
    };
    const user = getStoredUser();
    const userEmail = user?.email || 'default';
    const remindersEnabledKey = `careLinkRemindersEnabled_${userEmail}`;
    const whatsappNumberKey = `careLinkWhatsAppNumber_${userEmail}`;

    const [showAddModal, setShowAddModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [newMedData, setNewMedData] = useState({
        name: '',
        dosage: '',
        frequency: 'Daily',
        time: '08:00 AM',
        stock: 30
    });
    const [editingMedId, setEditingMedId] = useState(null);

    const [remindersEnabled, setRemindersEnabled] = useState(
        localStorage.getItem(remindersEnabledKey) === 'true'
    );
    const [whatsappNumber, setWhatsappNumber] = useState(
        localStorage.getItem(whatsappNumberKey) || ''
    );
    const [phoneInput, setPhoneInput] = useState(
        localStorage.getItem(whatsappNumberKey) || ''
    );
    const [isEditingNumber, setIsEditingNumber] = useState(!localStorage.getItem(whatsappNumberKey));

    useEffect(() => {
        fetchMedications();
    }, []);

    // Request Notification permission when reminders are enabled
    useEffect(() => {
        if (remindersEnabled && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [remindersEnabled]);

    // Background timer scheduling for WhatsApp reminders
    useEffect(() => {
        // Clear all scheduled timeouts
        Object.values(timeoutsRef.current).forEach(clearTimeout);
        timeoutsRef.current = {};

        if (!remindersEnabled || !whatsappNumber || medications.length === 0) return;

        medications.forEach(med => {
            if (med.isTaken) return;

            const ms = parseTimeToMs(med.time);
            if (ms !== null && ms > 0) {
                const timeoutId = setTimeout(() => {
                    const fireKey = `${med._id}_${getTodayDateString()}`;
                    if (!firedRemindersRef.current.has(fireKey)) {
                        firedRemindersRef.current.add(fireKey);
                        
                        // Construct the alert message
                        const message = `Care Link AI Medication Reminder: It is time to take your ${med.name} (${med.dosage}) scheduled for ${med.time}.`;
                        
                        // Automatically open wa.me link in new tab
                        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
                        
                        // Send system notification if permission granted
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Care Link AI Medication Alert', {
                                body: `Time to take your ${med.name} (${med.dosage}) at ${med.time}.`,
                                requireInteraction: true
                            });
                        }
                    }
                }, ms);

                timeoutsRef.current[med._id] = timeoutId;
            }
        });

        return () => {
            Object.values(timeoutsRef.current).forEach(clearTimeout);
        };
    }, [medications, remindersEnabled, whatsappNumber]);

    const fetchMedications = async () => {
        try {
            const { data } = await api.get('/medications');
            setMedications(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching medications:', error);
            setLoading(false);
        }
    };

    const handleScan = () => {
        setShowScannerModal(true);
    };

    const handleScanResult = (medicine) => {
        if (!medicine) return;

        // Clean OCR garbage text
        const cleanName = (medicine.name || '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim();

        if (!cleanName) {
            alert('Could not detect pill properly. Try again.');
            return;
        }

        setEditingMedId(null);
        setNewMedData((prev) => ({
            ...prev,
            name: cleanName,
            dosage: medicine.dosage || medicine.dose || '',
            stock: 20
        }));

        setShowScannerModal(false);
        setShowAddModal(true);

        alert(`Pill detected: ${cleanName}`);
    };

    const handleMarkTaken = async (id, currentStatus) => {
        try {
            await api.put(`/medications/${id}`, { isTaken: true });
            fetchMedications();
        } catch (error) {
            alert('Failed to update medication status');
        }
    };

    const handleOpenAddModal = () => {
        setEditingMedId(null);
        setNewMedData({
            name: '',
            dosage: '',
            frequency: 'Daily',
            time: '08:00 AM',
            stock: 30
        });
        setShowAddModal(true);
    };

    const handleEditClick = (med) => {
        setEditingMedId(med._id);
        setNewMedData({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            time: med.time,
            stock: med.stock
        });
        setShowAddModal(true);
    };

    const handleSaveMedication = async (e) => {
        if (e) e.preventDefault();
        try {
            if (editingMedId) {
                await api.put(`/medications/${editingMedId}`, newMedData);
            } else {
                await api.post('/medications', newMedData);
            }
            setShowAddModal(false);
            setEditingMedId(null);
            fetchMedications();
            setNewMedData({
                name: '',
                dosage: '',
                frequency: 'Daily',
                time: '08:00 AM',
                stock: 30
            });
        } catch (error) {
            alert(editingMedId ? 'Failed to update medication' : 'Failed to add medication');
        }
    };

    useEffect(() => {
        setRemindersEnabled(localStorage.getItem(remindersEnabledKey) === 'true');
        setWhatsappNumber(localStorage.getItem(whatsappNumberKey) || '');
        setPhoneInput(localStorage.getItem(whatsappNumberKey) || '');
        setIsEditingNumber(!localStorage.getItem(whatsappNumberKey));
    }, [remindersEnabledKey, whatsappNumberKey]);

    const handleToggleReminders = (e) => {
        const enabled = e.target.checked;
        setRemindersEnabled(enabled);
        localStorage.setItem(remindersEnabledKey, enabled);
    };

    const handleSaveNumber = (e) => {
        e.preventDefault();
        const cleanNum = phoneInput.replace(/[^0-9]/g, '');
        if (!cleanNum) {
            alert('Please enter a valid phone number with country code (e.g. 919876543210)');
            return;
        }
        setWhatsappNumber(cleanNum);
        localStorage.setItem(whatsappNumberKey, cleanNum);
        setIsEditingNumber(false);
        setRemindersEnabled(true);
        localStorage.setItem(remindersEnabledKey, 'true');
    };

    const handleSendSingleReminder = (med) => {
        const num = whatsappNumber || phoneInput.replace(/[^0-9]/g, '');
        if (!num) {
            alert('Please configure your WhatsApp phone number in the reminders section first.');
            return;
        }
        const message = `Care Link AI Medication Reminder: It is time to take your ${med.name} (${med.dosage}) scheduled for ${med.time}.`;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleSendSummary = () => {
        const num = whatsappNumber || phoneInput.replace(/[^0-9]/g, '');
        if (!num) {
            alert('Please configure your WhatsApp phone number in the reminders section first.');
            return;
        }
        if (medications.length === 0) {
            alert('No medications in your schedule today.');
            return;
        }
        let message = `Care Link AI: Here is your medication schedule for today:\n`;
        medications.forEach(med => {
            message += `- ${med.name} (${med.dosage}): ${med.time} [${med.isTaken ? 'Taken' : 'Pending'}]\n`;
        });
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-card">
                <div>
                    <h2 className="text-2xl font-bold text-healthcare-dark">Medication Manager</h2>
                    <p className="text-gray-600">Track doses, refills, and smart reminders</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleScan}
                        className="px-6 py-3 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                    >
                        <span>{scanning ? '🔍' : '📸'}</span> {scanning ? 'Scanning...' : 'Pill Scanner'}
                    </button>
                    <button
                        onClick={handleOpenAddModal}
                        className="btn-primary flex items-center gap-2"
                    >
                        <span>➕</span> Add Medicine
                    </button>
                </div>
            </div>

            {/* Smart Reminders Banner */}
            <div className={`p-6 rounded-2xl shadow-lg transition-all border ${remindersEnabled
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-transparent'
                : 'bg-white text-gray-800 border-gray-200'
                }`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl p-2 bg-white bg-opacity-20 rounded-xl">📱</div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                WhatsApp Reminders
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${remindersEnabled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {remindersEnabled ? 'Active' : 'Disabled'}
                                </span>
                            </h3>

                            {remindersEnabled ? (
                                isEditingNumber ? (
                                    <p className="text-emerald-100 text-sm">Please save your phone number below to receive reminders.</p>
                                ) : (
                                    <p className="text-emerald-100 text-sm leading-relaxed">
                                        Configured for: <strong className="text-white">+{whatsappNumber}</strong>
                                        <span className="block text-[11px] text-amber-200 mt-1">
                                            ⚠️ Ensure you have allowed browser popups/redirects for this site to auto-launch WhatsApp at the scheduled times.
                                        </span>
                                    </p>
                                )
                            ) : (
                                <p className="text-gray-500 text-sm">Enable WhatsApp alerts to quickly send schedule summaries and reminders.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={remindersEnabled}
                                onChange={handleToggleReminders}
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-700"></div>
                        </label>
                    </div>
                </div>

                {remindersEnabled && (
                    <div className={`mt-6 pt-6 border-t border-white border-opacity-20`}>
                        {isEditingNumber ? (
                            <form onSubmit={handleSaveNumber} className="flex flex-col sm:flex-row gap-3 max-w-md">
                                <div className="flex-1">
                                    <input
                                        type="tel"
                                        placeholder="Phone with country code (e.g. 15551234567)"
                                        value={phoneInput}
                                        onChange={(e) => setPhoneInput(e.target.value)}
                                        className="w-full px-4 py-2 text-gray-950 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-white text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
                                >
                                    Save Number
                                </button>
                                {whatsappNumber && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingNumber(false)}
                                        className="px-4 py-2 border border-white border-opacity-40 text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </form>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleSendSummary}
                                    className="px-5 py-2.5 bg-white text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    💬 Send Today's Schedule
                                </button>
                                <button
                                    onClick={() => setIsEditingNumber(true)}
                                    className="px-4 py-2.5 border border-white border-opacity-40 text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors flex items-center gap-1.5"
                                >
                                    ✏️ Change Phone Number
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Medication List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {medications.map((med) => (
                    <div key={med._id} className="bg-white p-6 rounded-2xl shadow-card hover:shadow-hover transition-all flex gap-6 border border-transparent hover:border-blue-100">
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-inner transition-colors ${med.isTaken ? 'bg-green-50' : 'bg-blue-50'}`}>
                            {med.isTaken ? '✅' : '💊'}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`text-xl font-bold transition-colors ${med.isTaken ? 'text-green-700' : 'text-slate-800'}`}>{med.name}</h3>
                                <span className={`${med.isTaken ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                                    {med.frequency}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <span>📏</span> Dose: {med.dosage}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>⏰</span> Time: {med.time}
                                    {remindersEnabled && !med.isTaken && getMinutesUntilReminder(med.time) !== null && (
                                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse ml-2 flex items-center gap-0.5">
                                            🔔 in {getMinutesUntilReminder(med.time)}m
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                                <div className={`text-sm font-semibold ${med.stock < 7 ? 'text-red-500' : 'text-green-600'}`}>
                                    {med.stock} pills left
                                    {med.stock < 7 && <span className="ml-2 underline cursor-pointer">Refill?</span>}
                                </div>
                                <div className="flex gap-3 items-center">
                                    {med.isTaken ? (
                                        <span className="text-sm font-bold px-3 py-2 rounded-lg bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 cursor-default">
                                            🔒 Taken
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleMarkTaken(med._id, med.isTaken)}
                                            className="text-sm font-bold px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                        >
                                            Mark Taken
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSendSingleReminder(med)}
                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-sm font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200"
                                        title="Send WhatsApp reminder"
                                    >
                                        💬 WhatsApp
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(med)}
                                        className="text-gray-600 hover:text-blue-600 text-sm font-semibold"
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Placeholder */}
                <button
                    onClick={handleOpenAddModal}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-healthcare-primary hover:bg-blue-50 transition-colors group min-h-[200px]"
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:bg-blue-200 transition-colors text-gray-400 group-hover:text-blue-600">
                        ➕
                    </div>
                    <h3 className="font-semibold text-gray-500 group-hover:text-blue-700">Add New Medication</h3>
                </button>
            </div>

            {/* Mock Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={() => {
                                setShowAddModal(false);
                                setEditingMedId(null);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-healthcare-dark">
                            {editingMedId ? 'Edit Medication' : 'Add Medication'}
                        </h3>

                        <form onSubmit={handleSaveMedication} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Medicine Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Aspirin"
                                    value={newMedData.name}
                                    onChange={e => setNewMedData({ ...newMedData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Dosage</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. 10mg"
                                        value={newMedData.dosage}
                                        onChange={e => setNewMedData({ ...newMedData, dosage: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
                                    <select
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newMedData.frequency}
                                        onChange={e => setNewMedData({ ...newMedData, frequency: e.target.value })}
                                    >
                                        <option>Daily</option>
                                        <option>Twice Daily</option>
                                        <option>Weekly</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. 08:00 AM"
                                        value={newMedData.time}
                                        onChange={e => setNewMedData({ ...newMedData, time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="30"
                                        value={newMedData.stock}
                                        onChange={e => setNewMedData({ ...newMedData, stock: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full btn-primary py-3 mt-4"
                            >
                                {editingMedId ? 'Save Changes' : 'Save Medication'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {showScannerModal && (
                <PillScannerModal
                    onClose={() => setShowScannerModal(false)}
                    onResult={handleScanResult}
                />
            )}
        </div>
    );
};

export default Medications;
