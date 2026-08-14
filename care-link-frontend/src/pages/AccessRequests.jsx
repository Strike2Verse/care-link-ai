import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AccessRequests = () => {
    const user = JSON.parse(localStorage.getItem('careLinkUser'));
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/access/incoming');
            setRequests(data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleRespond = async (id, action) => {
        try {
            await api.put(`/access/${id}/respond`, { action });
            fetchRequests();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm('Revoke this access?')) return;
        try {
            await api.put(`/access/${id}/revoke`);
            fetchRequests();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
    const pending = requests.filter(r => r.status === 'pending');

    const timeAgo = (date) => {
        const s = Math.floor((Date.now() - new Date(date)) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return new Date(date).toLocaleDateString();
    };

    const statusStyles = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        accepted: 'bg-green-100 text-green-700 border-green-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
        revoked: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 md:p-8 text-white shadow-lg">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">🔔 Access Requests</h2>
                <p className="text-amber-100 text-base md:text-lg">
                    {pending.length > 0
                        ? `You have ${pending.length} pending request${pending.length > 1 ? 's' : ''} awaiting your response.`
                        : 'No pending requests. You\'re all caught up!'}
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'accepted', 'rejected', 'revoked'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}>
                        {f} {f === 'pending' && pending.length > 0 && <span className="ml-1 bg-white text-indigo-600 px-1.5 py-0.5 rounded-full text-xs">{pending.length}</span>}
                    </button>
                ))}
            </div>

            {/* Request Cards */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 shadow-md text-center">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No {filter !== 'all' ? filter : ''} requests</h3>
                    <p className="text-gray-500">Nothing to show here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(req => (
                        <div key={req._id} className={`bg-white rounded-2xl p-5 shadow-md border-l-4 hover:shadow-lg transition-all ${statusStyles[req.status]?.split(' ').pop() ? `border-l-${req.status === 'pending' ? 'amber' : req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'red' : 'gray'}-400` : 'border-l-gray-200'}`}
                            style={{ borderLeftColor: req.status === 'pending' ? '#f59e0b' : req.status === 'accepted' ? '#22c55e' : req.status === 'rejected' ? '#ef4444' : '#9ca3af' }}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${req.requesterRole === 'doctor' ? 'bg-green-100' : 'bg-purple-100'}`}>
                                        {req.requesterRole === 'doctor' ? '⚕️' : '👨‍👩‍👧‍👦'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{req.requester?.fullName || 'Unknown'}</h4>
                                        <p className="text-sm text-gray-500">
                                            {req.requesterRole === 'doctor' ? 'Healthcare Provider' : 'Family Member'} • {req.requester?.email}
                                        </p>
                                        {req.message && <p className="text-sm text-gray-600 italic mt-1">"{req.message}"</p>}
                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(req.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {req.status === 'pending' && (<>
                                        <button onClick={() => handleRespond(req._id, 'accept')}
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 text-sm transition-all shadow-sm">
                                            ✓ Accept
                                        </button>
                                        <button onClick={() => handleRespond(req._id, 'reject')}
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 text-sm transition-all">
                                            ✕ Reject
                                        </button>
                                    </>)}
                                    {req.status === 'accepted' && (
                                        <button onClick={() => handleRevoke(req._id)}
                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 text-sm transition-all">
                                            🚫 Revoke
                                        </button>
                                    )}
                                    {(req.status === 'rejected' || req.status === 'revoked') && (
                                        <span className={`px-4 py-2 rounded-xl text-sm font-bold ${statusStyles[req.status]}`}>{req.status}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AccessRequests;
