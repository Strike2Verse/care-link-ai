import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PatientCarePortalModal = ({ patient, onClose }) => {
    const [activeTab, setActiveTab] = useState('medications');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [activities, setActivities] = useState([]);
    const [medications, setMedications] = useState([]);
    const [vitals, setVitals] = useState([]);
    const [records, setRecords] = useState([]);

    // Medication Form States
    const [showFormModal, setShowFormModal] = useState(false);
    const [formError, setFormError] = useState('');
    const [savingMed, setSavingMed] = useState(false);
    const [editingMed, setEditingMed] = useState(null);
    const [medForm, setMedForm] = useState({
        name: '',
        dosage: '',
        frequency: 'Daily',
        time: '08:00 AM',
        stock: 30
    });

    useEffect(() => {
        if (patient) {
            fetchAllData();
        }
    }, [patient]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchSummary(),
                fetchMedications(),
                fetchActivities(),
                fetchVitals(),
                fetchRecords()
            ]);
        } catch (err) {
            console.error('Error fetching patient portal data:', err);
        }
        setLoading(false);
    };

    const fetchSummary = async () => {
        const { data } = await api.get(`/patient-data/${patient._id}/summary`);
        setSummary(data);
    };

    const fetchMedications = async () => {
        const { data } = await api.get(`/patient-data/${patient._id}/medications`);
        setMedications(data);
    };

    const fetchActivities = async () => {
        const { data } = await api.get(`/activity/${patient._id}`);
        setActivities(data);
    };

    const fetchVitals = async () => {
        const { data } = await api.get(`/patient-data/${patient._id}/vitals`);
        setVitals(data);
    };

    const fetchRecords = async () => {
        const { data } = await api.get(`/patient-data/${patient._id}/records`);
        setRecords(data);
    };

    const handleToggleTaken = async (med) => {
        try {
            await api.put(`/patient-data/${patient._id}/medications/${med._id}/taken`);
            await fetchMedications();
            await fetchSummary();
            await fetchActivities();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update medication status');
        }
    };

    const handleDeleteMed = async (medId) => {
        if (!window.confirm('Are you sure you want to delete this medication?')) return;
        try {
            await api.delete(`/patient-data/${patient._id}/medications/${medId}`);
            await fetchMedications();
            await fetchSummary();
            await fetchActivities();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete medication');
        }
    };

    const handleOpenAddForm = () => {
        setEditingMed(null);
        setMedForm({
            name: '',
            dosage: '',
            frequency: 'Daily',
            time: '08:00 AM',
            stock: 30
        });
        setFormError('');
        setShowFormModal(true);
    };

    const handleOpenEditForm = (med) => {
        setEditingMed(med);
        setMedForm({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            time: med.time,
            stock: med.stock
        });
        setFormError('');
        setShowFormModal(true);
    };

    const handleSaveMedication = async (e) => {
        e.preventDefault();
        if (!medForm.name || !medForm.dosage || !medForm.time) {
            setFormError('Please fill in all required fields');
            return;
        }
        setSavingMed(true);
        setFormError('');
        try {
            if (editingMed) {
                await api.put(`/patient-data/${patient._id}/medications/${editingMed._id}`, medForm);
            } else {
                await api.post(`/patient-data/${patient._id}/medications`, medForm);
            }
            setShowFormModal(false);
            await fetchMedications();
            await fetchSummary();
            await fetchActivities();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save medication');
        } finally {
            setSavingMed(false);
        }
    };

    const handleDownloadRecord = async (recordId, originalName) => {
        try {
            const response = await api.get(`/patient-data/${patient._id}/records/${recordId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalName || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download document');
        }
    };

    const timeAgo = (date) => {
        const s = Math.floor((Date.now() - new Date(date)) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    const actionIcons = {
        access_requested: '🔗', access_granted: '✅', access_denied: '❌',
        access_revoked: '🚫', added_medication: '💊', marked_taken: '✔️',
        marked_untaken: '↩️', uploaded_report: '📄', added_prescription: '📋'
    };

    const getFileIcon = (mimeType, fileName) => {
        if (!mimeType && !fileName) return '📄';
        const mime = mimeType || '';
        const name = (fileName || '').toLowerCase();
        if (mime.startsWith('image/')) return '🖼️';
        if (mime === 'application/pdf' || name.endsWith('.pdf')) return '📕';
        if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return '📘';
        if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return '📗';
        return '📄';
    };

    if (!patient) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-chatbot overflow-hidden flex flex-col max-h-[90vh] border border-gray-100" style={{ animation: 'bounceIn 0.3s ease-out' }}>
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 md:p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 hover:bg-white/35 transition-colors text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                        ✕
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                            {patient.role === 'elder' ? '👴' : '👤'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{patient.fullName}</h2>
                            <p className="text-blue-100 text-sm">{patient.email} • Patient Profile</p>
                        </div>
                    </div>

                    {/* Stats Dashboard Row */}
                    {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                            <div className="bg-white/10 rounded-2xl p-3 text-center">
                                <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Medications</p>
                                <p className="text-xl font-bold mt-0.5">{summary.stats?.totalMedications || 0}</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 text-center">
                                <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Adherence Rate</p>
                                <p className="text-xl font-bold mt-0.5">{summary.stats?.adherenceRate || 0}%</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 text-center">
                                <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Vault Documents</p>
                                <p className="text-xl font-bold mt-0.5">{summary.stats?.totalRecords || 0}</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 text-center">
                                <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Low Stock Alerts</p>
                                <p className="text-xl font-bold mt-0.5 text-amber-200">
                                    {summary.stats?.lowStockAlerts?.length || 0}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/70 p-2 gap-1">
                    {[
                        { id: 'medications', label: '💊 Medications', color: 'text-emerald-600' },
                        { id: 'vitals', label: '📊 Vitals', color: 'text-blue-600' },
                        { id: 'records', label: '📄 Medical Vault', color: 'text-purple-600' },
                        { id: 'activities', label: '📋 Activities', color: 'text-amber-600' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-2xl font-bold text-base transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-white text-healthcare-dark shadow-sm border border-gray-100'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Fetching patient medical profile...</p>
                        </div>
                    ) : (
                        <>
                            {/* MEDICATIONS TAB */}
                            {activeTab === 'medications' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                                        <div>
                                            <h3 className="font-bold text-healthcare-dark text-lg">Active Medications</h3>
                                            <p className="text-xs text-gray-500">Add, edit, delete, or mark medication doses for {patient.fullName}</p>
                                        </div>
                                        <button onClick={handleOpenAddForm} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                                            <span>➕</span> Add Medicine
                                        </button>
                                    </div>

                                    {summary?.stats?.lowStockAlerts?.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                                            <span className="text-xl">⚠️</span>
                                            <div>
                                                <h4 className="font-bold text-amber-800 text-sm">Low Stock Alert</h4>
                                                <p className="text-xs text-amber-700 mt-0.5">
                                                    The following medications are running low and need refills: {
                                                        summary.stats.lowStockAlerts.map(m => `"${m.name}" (${m.stock} remaining)`).join(', ')
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {medications.length === 0 ? (
                                        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl">
                                            <span className="text-4xl">💊</span>
                                            <h4 className="font-bold text-gray-700 mt-3 text-lg">No Medications Scheduled</h4>
                                            <p className="text-sm text-gray-500 mt-1">There are no medications configured for this patient yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {medications.map(med => (
                                                <div key={med._id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                                    med.isTaken 
                                                        ? 'bg-emerald-50/40 border-emerald-100' 
                                                        : 'bg-white border-gray-100 hover:shadow-md'
                                                }`}>
                                                    <div>
                                                        <div className="flex justify-between items-start gap-2">
                                                            <h4 className="font-bold text-lg text-slate-800">{med.name}</h4>
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                med.isTaken 
                                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                                    : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                                {med.isTaken ? 'Taken' : 'Pending'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 font-semibold mt-1">💊 Dose: {med.dosage}</p>
                                                        
                                                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-gray-500 bg-gray-50/50 p-2.5 rounded-xl">
                                                            <div>⏱️ {med.time}</div>
                                                            <div>🔄 {med.frequency}</div>
                                                            <div className="col-span-2 border-t border-gray-100 mt-1 pt-1 flex justify-between">
                                                                <span>Refill Stock:</span>
                                                                <span className={`font-bold ${med.stock < 7 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                                                                    {med.stock} remaining
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                                        {med.isTaken ? (
                                                            <span className="flex-1 py-2.5 font-bold rounded-xl text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1 cursor-default">
                                                                🔒 Taken
                                                            </span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleToggleTaken(med)}
                                                                className="flex-1 py-2 font-bold rounded-xl text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                                            >
                                                                ✔️ Mark Taken
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleOpenEditForm(med)}
                                                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-colors"
                                                            title="Edit Medication"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteMed(med._id)}
                                                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                                                            title="Delete Medication"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VITALS TAB */}
                            {activeTab === 'vitals' && (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <h3 className="font-bold text-healthcare-dark text-lg">Vital Signs History</h3>
                                        <p className="text-xs text-gray-500">Recent physiological readings recorded by patient or devices</p>
                                    </div>

                                    {vitals.length === 0 ? (
                                        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl">
                                            <span className="text-4xl">📊</span>
                                            <h4 className="font-bold text-gray-700 mt-3 text-lg">No Vitals Logged</h4>
                                            <p className="text-sm text-gray-500 mt-1">There are no vital sign measurements recorded for this patient.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                                                            <th className="p-4 pl-6">Vital Sign</th>
                                                            <th className="p-4">Measurement Value</th>
                                                            <th className="p-4">Clinical Status</th>
                                                            <th className="p-4 pr-6">Date Recorded</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-sm">
                                                        {vitals.map(v => {
                                                            const statusStyles = {
                                                                Normal: 'bg-green-50 text-green-700 border border-green-200',
                                                                Good: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                                                Warning: 'bg-amber-50 text-amber-700 border border-amber-200',
                                                                Critical: 'bg-red-50 text-red-700 border border-red-200 animate-pulse',
                                                            };
                                                            return (
                                                                <tr key={v._id} className="hover:bg-gray-50/40 transition-colors">
                                                                    <td className="p-4 pl-6 font-bold text-slate-800 flex items-center gap-2">
                                                                        <span>
                                                                            {v.type === 'Heart Rate' ? '❤️' :
                                                                             v.type === 'Blood Pressure' ? '🩺' :
                                                                             v.type === 'Glucose' ? '🩸' :
                                                                             v.type === 'Sleep' ? '💤' : '📌'}
                                                                        </span>
                                                                        {v.type}
                                                                    </td>
                                                                    <td className="p-4 font-semibold text-slate-700">{v.value}</td>
                                                                    <td className="p-4">
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                            statusStyles[v.status] || 'bg-gray-50 text-gray-600'
                                                                        }`}>
                                                                            {v.status || 'Normal'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 pr-6 text-xs text-gray-500">
                                                                        {new Date(v.date || v.createdAt).toLocaleDateString()} at {
                                                                            new Date(v.date || v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MEDICAL VAULT TAB */}
                            {activeTab === 'records' && (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <h3 className="font-bold text-healthcare-dark text-lg">Medical Vault</h3>
                                        <p className="text-xs text-gray-500">View and download report transcripts, prescriptions, and lab reports</p>
                                    </div>

                                    {records.length === 0 ? (
                                        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl">
                                            <span className="text-4xl">📄</span>
                                            <h4 className="font-bold text-gray-700 mt-3 text-lg">No Documents Uploaded</h4>
                                            <p className="text-sm text-gray-500 mt-1">There are no reports or prescriptions saved in the vault for this patient.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {records.map(record => (
                                                <div key={record._id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                                record.type === 'Prescription' ? 'bg-purple-50 text-purple-700' :
                                                                record.type === 'Report' ? 'bg-blue-50 text-blue-700' :
                                                                record.type === 'Lab' ? 'bg-red-50 text-red-700' :
                                                                'bg-green-50 text-green-700'
                                                            }`}>
                                                                {record.type}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-medium">{record.size}</span>
                                                        </div>

                                                        <h4 className="font-bold text-slate-800 truncate" title={record.title}>{record.title}</h4>
                                                        
                                                        {record.originalName && (
                                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                                <span>{getFileIcon(record.mimeType, record.originalName)}</span>
                                                                <span className="truncate max-w-[200px]">{record.originalName}</span>
                                                            </p>
                                                        )}

                                                        <p className="text-xs text-gray-500 mt-4">Uploaded on {new Date(record.date).toLocaleDateString()}</p>
                                                    </div>

                                                    <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4 text-xs">
                                                        <span className="font-medium text-slate-600">Dr. {record.doctor}</span>
                                                        <button 
                                                            onClick={() => handleDownloadRecord(record._id, record.originalName || record.title)}
                                                            className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            📥 Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ACTIVITIES TAB */}
                            {activeTab === 'activities' && (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <h3 className="font-bold text-healthcare-dark text-lg">Activity Audits</h3>
                                        <p className="text-xs text-gray-500">Timeline of updates, logs, and healthcare alerts for {patient.fullName}</p>
                                    </div>

                                    {activities.length === 0 ? (
                                        <p className="text-center py-10 text-gray-400">No activity logged for this patient yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {activities.map((log, i) => (
                                                <div key={log._id || i} className="flex items-start gap-3 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50/50 transition-colors">
                                                    <span className="text-2xl mt-0.5">{actionIcons[log.action] || '📌'}</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-800 text-sm">{log.description}</p>
                                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                                            <span>by {log.actor?.fullName || 'System'}</span>
                                                            <span>•</span>
                                                            <span>{timeAgo(log.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* NESTED MEDICATION ADD / EDIT FORM MODAL */}
            {showFormModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
                        <button onClick={() => setShowFormModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg">
                            ✕
                        </button>
                        <h3 className="text-xl font-bold text-healthcare-dark mb-4">
                            {editingMed ? '✏️ Edit Medication' : '➕ Add Medication'}
                        </h3>

                        <form onSubmit={handleSaveMedication} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Medication Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    placeholder="e.g. Metformin"
                                    value={medForm.name}
                                    onChange={e => setMedForm({ ...medForm, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dosage *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        placeholder="e.g. 500mg"
                                        value={medForm.dosage}
                                        onChange={e => setMedForm({ ...medForm, dosage: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Count *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        value={medForm.stock}
                                        onChange={e => setMedForm({ ...medForm, stock: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frequency</label>
                                    <select
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        value={medForm.frequency}
                                        onChange={e => setMedForm({ ...medForm, frequency: e.target.value })}
                                    >
                                        <option value="Daily">Daily</option>
                                        <option value="Twice Daily">Twice Daily</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="As Needed">As Needed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Scheduled Time *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        placeholder="e.g. 08:00 AM"
                                        value={medForm.time}
                                        onChange={e => setMedForm({ ...medForm, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            {formError && (
                                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl font-medium">{formError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={savingMed}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-sm transition-all mt-4 flex items-center justify-center gap-2"
                            >
                                {savingMed ? '⏳ Saving...' : 'Save Medication'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientCarePortalModal;
