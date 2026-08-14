import { useState } from 'react';
import api from '../services/api';

function PillScannerModal({ onClose, onResult }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fallback, setFallback] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setFallback(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    try {
      // Using the api service instance so auth headers are attached
      const response = await api.post('/scan/pill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;
      if (data.success) {
        onResult(data.medicine);
      } else if (data.fallback) {
        setFallback(true);
      } else if (data.message) {
        setError(data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Please scan clearly');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    // Pass the manual query back to the parent to prefill the Add Medication form
    onResult({ name: manualQuery, description: 'Manual entry' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📷 Scan Pill</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Capture or Upload Image</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {previewUrl && (
            <div className="mt-4">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-sm border border-gray-100" />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading || !selectedFile}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
              </>
            ) : 'Send to Scan'}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {fallback && (
            <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <p className="text-gray-600 mb-3 text-sm font-medium">No OCR text found. Search manually:</p>
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Enter medication name"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
              />
              <button
                onClick={handleManualSearch}
                disabled={!manualQuery.trim()}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                Use Manual Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PillScannerModal;
