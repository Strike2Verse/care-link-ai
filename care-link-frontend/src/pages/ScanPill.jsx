import { useState } from 'react';
import api from '../services/api';

function ScanPillPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fallback, setFallback] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
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
      const response = await api.post('/scan/pill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;
      if (data.success) {
        setResult(data.medicine);
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
    // Placeholder: in a real app, call medication search API
    setResult({ name: manualQuery, description: 'Manual search placeholder.' });
    setFallback(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">📷 Scan Pill</h1>
      <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-md">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="mb-2 w-full"
        />
        {previewUrl && (
          <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded mb-2" />
        )}
        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          {loading ? 'Scanning...' : 'Send to Scan'}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {result && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold">{result.name}</h2>
            <p className="mt-1 text-gray-700">{result.description}</p>
          </div>
        )}
        {fallback && (
          <div className="mt-4">
            <p className="text-gray-600 mb-2">No OCR text found. Search manually:</p>
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Enter medication name"
              className="border rounded w-full p-2 mb-2"
            />
            <button
              onClick={handleManualSearch}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanPillPage;
