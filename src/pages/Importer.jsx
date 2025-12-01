import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeImage } from '../lib/gemini';
import { addMock } from '../lib/db';
import Layout from '../components/Layout';
import { Upload, Loader2 } from 'lucide-react';

export default function Importer() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const data = await analyzeImage(preview);
      const id = await addMock(preview, data);
      navigate(`/mock/${id}`);
    } catch (err) {
      alert("Failed to analyze. Please try a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-things p-8 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Mock</h2>
        
        {!preview ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <span className="text-sm text-gray-500">Click to upload mock screenshot</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="relative">
            <img src={preview} alt="Preview" className="rounded-lg max-h-96 mx-auto mb-6 shadow-md" />
            <button 
              onClick={() => setPreview(null)} 
              className="text-xs text-red-500 underline absolute top-2 right-2 bg-white px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
        )}

        {preview && (
          <button
            onClick={processImage}
            disabled={loading}
            className="w-full mt-4 bg-things-blue text-white font-medium py-3 rounded-lg shadow-md hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Analyze with Gemini'}
          </button>
        )}
      </div>
    </Layout>
  );
}