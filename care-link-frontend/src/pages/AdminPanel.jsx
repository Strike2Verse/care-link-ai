import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ fullName: '', role: '' });
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/auth/users');
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            // If not authorized, redirect
            if (error.response && error.response.status === 401) {
                navigate('/');
            }
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditForm({
            fullName: user.fullName,
            role: user.role
        });
    };

    const handleEditClose = () => {
        setEditingUser(null);
        setEditForm({ fullName: '', role: '' });
    };

    const handleSaveEdit = async () => {
        if (!editForm.fullName.trim()) {
            alert('Name cannot be empty');
            return;
        }
        setSaving(true);
        try {
            await api.put(`/auth/users/${editingUser._id}`, {
                fullName: editForm.fullName,
                role: editForm.role
            });
            handleEditClose();
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) return;
        try {
            await api.delete(`/auth/users/${userId}`);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const roleColors = {
        admin: 'bg-orange-100 text-orange-600',
        doctor: 'bg-green-100 text-green-600',
        family: 'bg-purple-100 text-purple-600',
        elder: 'bg-blue-100 text-blue-600'
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-healthcare-dark">Admin Panel</h2>
                        <p className="text-gray-600">Manage user access and roles</p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                        {users.length} Users Total
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-semibold text-healthcare-dark">{user.fullName}</td>
                                    <td className="p-4 text-gray-600">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                            ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="text-healthcare-primary hover:text-blue-800 font-medium text-sm"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user._id, user.fullName)}
                                                className="text-red-400 hover:text-red-600 font-medium text-sm"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={handleEditClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-bold mb-2 text-healthcare-dark">Edit User</h3>
                        <p className="text-gray-500 mb-6">{editingUser.email}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                >
                                    <option value="elder">Elder</option>
                                    <option value="family">Family Member</option>
                                    <option value="doctor">Healthcare Provider</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleEditClose}
                                    className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-white transition-all
                                        ${saving ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary hover:shadow-lg'}`}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
