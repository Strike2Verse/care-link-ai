import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PatientCarePortalModal from '../components/PatientCarePortalModal';

const ManageFamilyAccess = () => {
    const user = JSON.parse(localStorage.getItem('careLinkUser'));
    const isCaregiver = user?.role === 'doctor' || user?.role === 'family' || user?.role === 'admin';

    const [patientEmail, setPatientEmail] = useState('');
    const [message, setMessage] = useState('');
    const [connectedPatients, setConnectedPatients] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [caregivers, setCaregivers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            if (isCaregiver) {
                const [pRes, rRes, aRes] = await Promise.all([
                    api.get('/access/connected-patients'),
                    api.get('/access/my-requests'),
                    api.get('/activity/connected/recent')
                ]);
                setConnectedPatients(pRes.data);
                setMyRequests(rRes.data);
                setActivities(aRes.data);
            } else {
                const [iRes, cRes, aRes] = await Promise.all([
                    api.get('/access/incoming'),
                    api.get('/access/my-caregivers'),
                    api.get('/activity/me/feed')
                ]);
                setIncomingRequests(iRes.data);
                setCaregivers(cRes.data);
                setActivities(aRes.data);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!patientEmail) return;
        setSending(true);
        setStatusMsg({ text: '', type: '' });
        try {
            await api.post('/access/request', { patientEmail, message });
            setStatusMsg({ text: 'Access request sent successfully!', type: 'success' });
            setPatientEmail(''); setMessage('');
            fetchAll();
        } catch (err) {
            setStatusMsg({ text: err.response?.data?.message || 'Failed to send request', type: 'error' });
        }
        setSending(false);
    };

    const handleRespond = async (id, action) => {
        try {
            await api.put(`/access/${id}/respond`, { action });
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm('Revoke access?')) return;
        try {
            await api.put(`/access/${id}/revoke`);
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700',
        accepted: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        revoked: 'bg-gray-100 text-gray-600'
    };

    const actionIcons = {
        access_requested: '🔗', access_granted: '✅', access_denied: '❌',
        access_revoked: '🚫', added_medication: '💊', marked_taken: '✔️',
        marked_untaken: '↩️', uploaded_report: '📄', added_prescription: '📋'
    };

    const timeAgo = (date) => {
        const s = Math.floor((Date.now() - new Date(date)) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');
    const pendingSent = myRequests.filter(r => r.status === 'pending');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    👥 {isCaregiver ? 'Manage Patient Access' : 'My Care Network'}
                </h2>
                <p className="text-indigo-100 text-base md:text-lg">
                    {isCaregiver ? 'Connect with patients and manage their healthcare collaboratively.' : 'Review who has access to your health profile.'}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {['overview', 'activity', ...(isCaregiver ? ['patients'] : ['caregivers'])].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}>
                        {tab === 'overview' ? '📊 Overview' : tab === 'activity' ? '📋 Activity' : tab === 'patients' ? '🏥 Patients' : '👨‍⚕️ Caregivers'}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Connect Patient Form (Caregiver only) */}
                    {isCaregiver && (
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">🔗 Connect Patient Profile</h3>
                            <form onSubmit={handleConnect} className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input type="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)}
                                        placeholder="Enter patient's registered email" required
                                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                                    <button type="submit" disabled={sending}
                                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all whitespace-nowrap shadow-sm">
                                        {sending ? '⏳ Sending...' : '🔗 Connect Profile'}
                                    </button>
                                </div>
                                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                                    placeholder="Optional message (e.g., 'I am your cardiologist')"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                                {statusMsg.text && (
                                    <div className={`p-3 rounded-xl text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {statusMsg.text}
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {isCaregiver ? (<>
                            <StatCard icon="🏥" label="Connected" value={connectedPatients.length} color="bg-green-50 text-green-700" />
                            <StatCard icon="⏳" label="Pending" value={pendingSent.length} color="bg-amber-50 text-amber-700" />
                            <StatCard icon="📋" label="Activities" value={activities.length} color="bg-blue-50 text-blue-700" />
                            <StatCard icon="🚨" label="Alerts" value={connectedPatients.filter(c => c.patient?.email).length > 0 ? '—' : '0'} color="bg-red-50 text-red-700" />
                        </>) : (<>
                            <StatCard icon="👨‍⚕️" label="Caregivers" value={caregivers.length} color="bg-green-50 text-green-700" />
                            <StatCard icon="📩" label="Pending" value={pendingIncoming.length} color="bg-amber-50 text-amber-700" />
                            <StatCard icon="📋" label="Activities" value={activities.length} color="bg-blue-50 text-blue-700" />
                            <StatCard icon="🔒" label="Security" value="Active" color="bg-emerald-50 text-emerald-700" />
                        </>)}
                    </div>

                    {/* Incoming Requests (Patient only) */}
                    {!isCaregiver && pendingIncoming.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">📩 Pending Access Requests</h3>
                            <div className="space-y-3">
                                {pendingIncoming.map(req => (
                                    <div key={req._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-amber-50 rounded-xl gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                                                {req.requesterRole === 'doctor' ? '⚕️' : '👨‍👩‍👧‍👦'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{req.requester?.fullName}</p>
                                                <p className="text-sm text-gray-500">{req.requesterRole === 'doctor' ? 'Doctor' : 'Family Member'} • {req.requester?.email}</p>
                                                {req.message && <p className="text-sm text-gray-600 italic mt-1">"{req.message}"</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button onClick={() => handleRespond(req._id, 'accept')}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-sm transition-colors">✓ Accept</button>
                                            <button onClick={() => handleRespond(req._id, 'reject')}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 text-sm transition-colors">✕ Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Sent (Caregiver) */}
                    {isCaregiver && pendingSent.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">⏳ Awaiting Patient Approval</h3>
                            <div className="space-y-3">
                                {pendingSent.map(req => (
                                    <div key={req._id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-lg">👴</div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{req.patient?.fullName || 'Patient'}</p>
                                                <p className="text-sm text-gray-500">{req.patient?.email} • {timeAgo(req.createdAt)}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Pending</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity Preview */}
                    {activities.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">📋 Recent Activity</h3>
                            <div className="space-y-3">
                                {activities.slice(0, 5).map((log, i) => (
                                    <div key={log._id || i} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <span className="text-xl mt-0.5">{actionIcons[log.action] || '📌'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-800 font-medium truncate">{log.description}</p>
                                            <p className="text-xs text-gray-400">{timeAgo(log.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Full Activity Log</h3>
                    {activities.length === 0 ? (
                        <p className="text-center py-10 text-gray-400">No activity recorded yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((log, i) => (
                                <div key={log._id || i} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <span className="text-2xl">{actionIcons[log.action] || '📌'}</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{log.description}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-500">by {log.actor?.fullName || 'Unknown'}</span>
                                            <span className="text-xs text-gray-400">{timeAgo(log.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PATIENTS TAB (Caregiver) */}
            {activeTab === 'patients' && isCaregiver && (
                <div className="space-y-6">
                    {connectedPatients.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 shadow-md text-center">
                            <div className="text-5xl mb-4">🔗</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No Connected Patients</h3>
                            <p className="text-gray-500">Use the Connect Patient form to link with a patient's profile.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {connectedPatients.map(conn => (
                                <div key={conn._id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all flex flex-col justify-between">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">👴</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800">{conn.patient?.fullName}</h4>
                                            <p className="text-sm text-gray-500">{conn.patient?.email}</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Connected</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-2">
                                        <span className="text-xs text-gray-400">Linked {timeAgo(conn.updatedAt)}</span>
                                        <button onClick={() => setSelectedPatient(conn.patient)}
                                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl text-xs transition-colors">
                                            🔍 View Care Portal
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* All Requests History */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">📜 Request History</h3>
                        <div className="space-y-2">
                            {myRequests.map(req => (
                                <div key={req._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">👴</span>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{req.patient?.fullName || 'Patient'}</p>
                                            <p className="text-xs text-gray-400">{req.patient?.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[req.status]}`}>{req.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CAREGIVERS TAB (Patient) */}
            {activeTab === 'caregivers' && !isCaregiver && (
                <div className="space-y-6">
                    {caregivers.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 shadow-md text-center">
                            <div className="text-5xl mb-4">👨‍⚕️</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No Connected Caregivers</h3>
                            <p className="text-gray-500">When a doctor or family member requests access, you'll see it here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {caregivers.map(cg => (
                                <div key={cg._id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${cg.requesterRole === 'doctor' ? 'bg-green-100' : 'bg-purple-100'}`}>
                                            {cg.requesterRole === 'doctor' ? '⚕️' : '👨‍👩‍👧‍👦'}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800">{cg.requester?.fullName}</h4>
                                            <p className="text-sm text-gray-500">{cg.requesterRole === 'doctor' ? 'Doctor' : 'Family Member'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">Access since {timeAgo(cg.updatedAt)}</span>
                                        <button onClick={() => handleRevoke(cg._id)}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                                            Revoke Access
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* All incoming requests history */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">📜 Request History</h3>
                        {incomingRequests.length === 0 ? (
                            <p className="text-center py-6 text-gray-400">No requests yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {incomingRequests.map(req => (
                                    <div key={req._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{req.requesterRole === 'doctor' ? '⚕️' : '👨‍👩‍👧‍👦'}</span>
                                            <p className="font-medium text-slate-800 text-sm">{req.requester?.fullName}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[req.status]}`}>{req.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {selectedPatient && (
                <PatientCarePortalModal
                    patient={selectedPatient}
                    onClose={() => {
                        setSelectedPatient(null);
                        fetchAll();
                    }}
                />
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className={`${color} rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all`}>
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs font-semibold opacity-75">{label}</div>
    </div>
);

export default ManageFamilyAccess;
