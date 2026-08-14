import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const MedicalVault = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);
    const dropZoneInputRef = useRef(null);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const [newRecord, setNewRecord] = useState({
        title: '',
        type: 'Report',
        doctor: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    // Clean up file preview URL on unmount or when file changes
    useEffect(() => {
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview);
        };
    }, [filePreview]);

    const fetchRecords = async () => {
        try {
            const { data } = await api.get('/vault');
            setRecords(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching records:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await api.delete(`/vault/${id}`);
            fetchRecords();
        } catch (error) {
            alert('Failed to delete record');
        }
    };

    const handleDownload = async (id, originalName) => {
        try {
            const response = await api.get(`/vault/${id}/download`, {
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
        } catch (error) {
            alert('Failed to download file');
        }
    };

    const validateFileSize = (file) => {
        if (file.size > MAX_FILE_SIZE) {
            alert(`File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum allowed size is 10MB.`);
            return false;
        }
        return true;
    };

    const setFileWithPreview = (file) => {
        if (!validateFileSize(file)) return false;
        setSelectedFile(file);
        // Generate preview for images
        if (file.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
        return true;
    };

    // Handle file selection from input
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!setFileWithPreview(file)) return;
            // Auto-fill title from filename if title is empty
            if (!newRecord.title) {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                setNewRecord(prev => ({ ...prev, title: nameWithoutExt }));
            }
        }
    };

    // Drag and drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (!setFileWithPreview(file)) return;
            if (!newRecord.title) {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                setNewRecord(prev => ({ ...prev, title: nameWithoutExt }));
            }
            // Open the modal if not already open
            if (!showModal) {
                setShowModal(true);
            }
        }
    };

    // Handle drop on the main page drop zone card
    const handleDropZoneDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (!setFileWithPreview(file)) return;
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            setNewRecord(prev => ({
                ...prev,
                title: prev.title || nameWithoutExt
            }));
            setShowModal(true);
        }
    };

    const handleDropZoneClick = () => {
        dropZoneInputRef.current?.click();
    };

    const handleDropZoneFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!setFileWithPreview(file)) return;
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            setNewRecord(prev => ({
                ...prev,
                title: prev.title || nameWithoutExt
            }));
            setShowModal(true);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', newRecord.title);
            formData.append('type', newRecord.type);
            formData.append('doctor', newRecord.doctor);
            formData.append('date', newRecord.date);

            await api.post('/vault', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                },
            });

            // Show success state
            setUploadSuccess(true);
            setUploadProgress(100);

            // Auto-close after 1.5s
            setTimeout(() => {
                setShowModal(false);
                setSelectedFile(null);
                setFilePreview(null);
                setUploadSuccess(false);
                setUploadProgress(0);
                fetchRecords();
                setNewRecord({
                    title: '',
                    type: 'Report',
                    doctor: '',
                    date: new Date().toISOString().split('T')[0]
                });
            }, 1500);
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to upload record';
            alert(msg);
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        setUploadSuccess(false);
        setNewRecord({
            title: '',
            type: 'Report',
            doctor: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

    const categories = ['All', 'Prescription', 'Report', 'Lab', 'Record'];

    const filteredRecords = selectedCategory === 'All'
        ? records
        : records.filter(r => r.type === selectedCategory);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-card flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-healthcare-dark">Medical Vault</h2>
                    <p className="text-gray-600">Securely store and manage your medical documents</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <span className="text-xl">⬆️</span> Upload Document
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${selectedCategory === cat
                            ? 'bg-healthcare-primary text-white shadow-soft'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Records List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Upload Drop Zone Card */}
                <div
                    onClick={handleDropZoneClick}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDropZoneDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[200px]
                        ${dragActive
                            ? 'border-healthcare-primary bg-blue-100 scale-[1.02] shadow-lg'
                            : 'border-gray-300 hover:border-healthcare-primary hover:bg-blue-50'
                        }`}
                >
                    <input
                        ref={dropZoneInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={handleDropZoneFileSelect}
                    />
                    <div className={`text-4xl mb-4 transition-transform ${dragActive ? 'scale-125 animate-bounce' : 'text-gray-400'}`}>
                        {dragActive ? '📥' : '📂'}
                    </div>
                    <h3 className="font-semibold text-gray-700">
                        {dragActive ? 'Drop your file here!' : 'Drag & Drop Files'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">or click to browse from your system</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Images, DOC, XLS, TXT (max 10MB)</p>
                </div>

                {filteredRecords.map((record) => (
                    <div key={record._id || record.id} className="bg-white rounded-2xl p-6 shadow-card hover:shadow-hover transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${record.type === 'Prescription' ? 'bg-purple-100 text-purple-600' :
                                record.type === 'Report' ? 'bg-blue-100 text-blue-600' :
                                    record.type === 'Lab' ? 'bg-red-100 text-red-600' :
                                        'bg-green-100 text-green-600'
                                }`}>
                                <span className="text-2xl">
                                    {record.type === 'Prescription' ? '💊' :
                                        record.type === 'Report' ? '📄' :
                                            record.type === 'Lab' ? '🧪' : '💉'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {record.fileUrl && (
                                    <button
                                        onClick={() => handleDownload(record._id, record.originalName || record.title)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Download"
                                    >
                                        ⬇️ Download
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(record._id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-healthcare-primary transition-colors">
                            {record.title}
                        </h3>

                        {record.originalName && (
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                <span>{getFileIcon(record.mimeType, record.originalName)}</span>
                                <span className="truncate">{record.originalName}</span>
                            </p>
                        )}

                        <p className="text-sm text-gray-500 mb-4">Added on {new Date(record.date).toLocaleDateString()}</p>

                        <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4">
                            <span className="text-gray-600 font-medium">{record.doctor}</span>
                            <span className="text-gray-400">{record.size}</span>
                        </div>
                    </div>
                ))}
            </div>


            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>

                        {/* Success State */}
                        {uploadSuccess ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4" style={{ animation: 'scaleIn 0.4s ease-out' }}>
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-green-700 mb-2">Upload Complete!</h3>
                                <p className="text-gray-500">Your document has been securely stored.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold mb-6 text-healthcare-dark">Upload Document</h3>
                                <form onSubmit={handleUpload} className="space-y-4">
                                    {/* File Upload Area */}
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                                            ${dragActive
                                                ? 'border-healthcare-primary bg-blue-50 scale-[1.02]'
                                                : selectedFile
                                                    ? 'border-green-400 bg-green-50'
                                                    : 'border-gray-300 hover:border-healthcare-primary hover:bg-blue-50'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                                            onChange={handleFileSelect}
                                        />

                                        {selectedFile ? (
                                            <div className="space-y-2">
                                                {/* Image Preview */}
                                                {filePreview ? (
                                                    <div className="mb-3">
                                                        <img
                                                            src={filePreview}
                                                            alt="Preview"
                                                            className="max-h-32 mx-auto rounded-lg object-contain shadow-sm border border-gray-200"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-3xl">{getFileIcon(selectedFile.type, selectedFile.name)}</div>
                                                )}
                                                <p className="font-semibold text-gray-800 truncate">{selectedFile.name}</p>
                                                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                                <p className="text-xs text-blue-600 hover:underline">Click to change file</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className={`text-4xl ${dragActive ? 'animate-bounce' : ''}`}>
                                                    {dragActive ? '📥' : '📁'}
                                                </div>
                                                <p className="font-semibold text-gray-700">
                                                    {dragActive ? 'Drop your file here!' : 'Click to select a file'}
                                                </p>
                                                <p className="text-sm text-gray-500">or drag and drop</p>
                                                <p className="text-xs text-gray-400">PDF, Images, DOC, XLS, TXT (max 10MB)</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newRecord.title}
                                            onChange={e => setNewRecord({ ...newRecord, title: e.target.value })}
                                            placeholder="e.g. Lab Results"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                                        <select
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newRecord.type}
                                            onChange={e => setNewRecord({ ...newRecord, type: e.target.value })}
                                        >
                                            {categories.filter(c => c !== 'All').map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Doctor / Source</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newRecord.doctor}
                                            onChange={e => setNewRecord({ ...newRecord, doctor: e.target.value })}
                                            placeholder="e.g. Dr. Smith"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newRecord.date}
                                            onChange={e => setNewRecord({ ...newRecord, date: e.target.value })}
                                        />
                                    </div>

                                    {/* Upload Progress Bar */}
                                    {uploading && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 font-medium">Uploading...</span>
                                                <span className="text-blue-600 font-bold">{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={uploading || !selectedFile}
                                        className={`w-full py-3 rounded-xl font-bold text-white transition-all
                                            ${uploading || !selectedFile
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'btn-primary hover:shadow-lg'
                                            }`}
                                    >
                                        {uploading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="animate-spin">⏳</span> Uploading...
                                            </span>
                                        ) : (
                                            `Upload${selectedFile ? ` "${selectedFile.name}"` : ''}`
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default MedicalVault;
