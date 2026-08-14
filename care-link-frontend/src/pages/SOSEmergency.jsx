import React, { useState, useEffect } from 'react';
import { getStoredUser } from '../services/api';

const SOSEmergency = () => {
    const user = getStoredUser();
    const userEmail = user?.email || 'default';
    const contactsKey = `careLinkEmergencyContacts_${userEmail}`;

    const [contacts, setContacts] = useState([]);
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', relationship: '', isPrimary: false });
    const [location, setLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        const savedContacts = localStorage.getItem(contactsKey);
        if (savedContacts) {
            setContacts(JSON.parse(savedContacts));
        }

        // Fetch location on mount
        fetchLocation();
    }, [contactsKey]);

    const saveContacts = (updated) => {
        setContacts(updated);
        localStorage.setItem(contactsKey, JSON.stringify(updated));
    };

    const fetchLocation = () => {
        if (!navigator.geolocation) {
            console.log("Geolocation is not supported by your browser");
            return;
        }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationLoading(false);
            },
            (error) => {
                console.error("Error obtaining location", error);
                setLocationLoading(false);
            }
        );
    };

    const handleOpenAddModal = () => {
        setEditingContact(null);
        setFormData({ name: '', phone: '', relationship: '', isPrimary: contacts.length === 0 });
        setShowContactModal(true);
    };

    const handleOpenEditModal = (contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship,
            isPrimary: contact.isPrimary
        });
        setShowContactModal(true);
    };

    const handleSaveContact = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.phone) {
            alert('Name and Phone Number are required.');
            return;
        }

        let updatedContacts = [...contacts];

        if (formData.isPrimary) {
            // Set all other contacts to non-primary
            updatedContacts = updatedContacts.map(c => ({ ...c, isPrimary: false }));
        }

        if (editingContact) {
            // Update
            updatedContacts = updatedContacts.map(c =>
                c.id === editingContact.id
                    ? { ...c, name: formData.name, phone: formData.phone.replace(/[^0-9]/g, ''), relationship: formData.relationship, isPrimary: formData.isPrimary }
                    : c
            );
        } else {
            // Create
            const newContact = {
                id: Date.now().toString(),
                name: formData.name,
                phone: formData.phone.replace(/[^0-9]/g, ''),
                relationship: formData.relationship,
                isPrimary: formData.isPrimary || contacts.length === 0
            };
            updatedContacts.push(newContact);
        }

        // If no primary is selected, make the first one primary
        if (updatedContacts.length > 0 && !updatedContacts.some(c => c.isPrimary)) {
            updatedContacts[0].isPrimary = true;
        }

        saveContacts(updatedContacts);
        setShowContactModal(false);
    };

    const handleDeleteContact = (id) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            const updated = contacts.filter(c => c.id !== id);
            // If we deleted the primary contact, assign a new one
            if (updated.length > 0 && !updated.some(c => c.isPrimary)) {
                updated[0].isPrimary = true;
            }
            saveContacts(updated);
        }
    };

    const handleTriggerSOS = () => {
        const primary = contacts.find(c => c.isPrimary);
        if (!primary) {
            alert('Please add an emergency contact first!');
            return;
        }

        // 1. Open phone dialer to call primary contact
        window.location.href = `tel:${primary.phone}`;

        // 2. Prepare WhatsApp emergency messages
        let mapLink = '';
        if (location) {
            mapLink = `\nMy Current Location: https://maps.google.com/?q=${location.lat},${location.lng}`;
        }
        const message = `🚨 EMERGENCY SOS ALERT! 🚨\nI need urgent assistance! Please contact me immediately.${mapLink}`;

        // Open WhatsApp link in a new tab after a brief delay
        setTimeout(() => {
            window.open(`https://wa.me/${primary.phone}?text=${encodeURIComponent(message)}`, '_blank');
        }, 1500);
    };

    const handleSendWhatsAppSOS = (contact) => {
        let mapLink = '';
        if (location) {
            mapLink = `\nMy Current Location: https://maps.google.com/?q=${location.lat},${location.lng}`;
        }
        const message = `🚨 EMERGENCY SOS ALERT! 🚨\nI need urgent assistance! Please contact me immediately.${mapLink}`;
        window.open(`https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Top Header */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <span>🚨</span> Emergency SOS Center
                    </h2>
                    <p className="text-gray-600">Instantly alert emergency services and designated contacts</p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="px-5 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl transition-all border border-red-200 flex items-center gap-2"
                >
                    <span>➕</span> Add Contact
                </button>
            </div>

            {/* Giant SOS Trigger Button Card */}
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[350px]">
                {/* Background pulse effect */}
                <div className="absolute inset-0 bg-red-500 opacity-10 animate-ping rounded-3xl pointer-events-none"></div>

                <h3 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-wide uppercase">Emergency SOS Trigger</h3>
                <p className="text-red-100 max-w-md mb-8 text-base md:text-lg">
                    Pressing the button below will call your primary contact immediately and prepare a WhatsApp alert with your location.
                </p>

                {/* Pulsing button */}
                <button
                    onClick={handleTriggerSOS}
                    className="w-40 h-40 bg-white text-red-600 font-black text-3xl rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-8 border-red-200 select-none relative group cursor-pointer animate-pulse"
                >
                    <span className="absolute inset-0 bg-red-100 rounded-full opacity-0 group-hover:opacity-40 transition-opacity animate-pulse"></span>
                    <span className="relative">SOS</span>
                </button>

                {location ? (
                    <div className="mt-8 flex items-center gap-2 bg-red-900 bg-opacity-40 px-4 py-2 rounded-full text-xs font-semibold">
                        <span className="text-green-400">●</span> Location Attached: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                ) : (
                    <div className="mt-8 flex items-center gap-2 bg-red-900 bg-opacity-40 px-4 py-2 rounded-full text-xs font-semibold text-red-200">
                        {locationLoading ? (
                            <span>Fetching GPS Location...</span>
                        ) : (
                            <button onClick={fetchLocation} className="hover:underline">
                                📍 Click to attach location
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-healthcare-dark flex items-center gap-2">
                    <span>👥</span> Emergency Contacts ({contacts.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contacts.map((contact) => (
                        <div
                            key={contact.id}
                            className={`bg-white p-5 rounded-2xl shadow-card border transition-all flex flex-col justify-between ${contact.isPrimary ? 'border-red-300 ring-2 ring-red-500/10' : 'border-gray-200'
                                }`}
                        >
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                                            {contact.name}
                                            {contact.isPrimary && (
                                                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                                    Primary
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-sm text-gray-500 font-medium">{contact.relationship}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 font-semibold flex items-center gap-1.5 text-base">
                                    <span>📞</span> +{contact.phone}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center gap-2">
                                <a
                                    href={`tel:${contact.phone}`}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    📞 Call
                                </a>
                                <button
                                    onClick={() => handleSendWhatsAppSOS(contact)}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    💬 WhatsApp
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenEditModal(contact)}
                                        className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors text-sm"
                                        title="Edit contact"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDeleteContact(contact.id)}
                                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors text-sm"
                                        title="Delete contact"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {contacts.length === 0 && (
                        <div className="col-span-full bg-white p-8 rounded-2xl shadow-card text-center border-2 border-dashed border-gray-300 text-gray-500">
                            <p className="text-lg font-semibold">No emergency contacts saved.</p>
                            <p className="text-sm text-gray-400 mt-1">Please add at least one contact to trigger SOS alerts.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Add/Edit Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold font-sans"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-healthcare-dark">
                            {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
                        </h3>

                        <form onSubmit={handleSaveContact} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-950 bg-white"
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-950 bg-white"
                                    placeholder="Include country code (e.g. 919876543210)"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Relationship</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-950 bg-white"
                                    placeholder="e.g. Spouse, Son, Doctor"
                                    value={formData.relationship}
                                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="isPrimaryCheckbox"
                                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                    checked={formData.isPrimary}
                                    onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })}
                                />
                                <label htmlFor="isPrimaryCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Mark as Primary Contact
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors"
                            >
                                {editingContact ? 'Save Changes' : 'Add Contact'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SOSEmergency;
