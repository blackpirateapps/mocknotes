import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeImage } from '../lib/gemini';
import { addMock } from '../lib/db';
import Layout from '../components/Layout';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';

export default function Importer() {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]); // Array of base64 strings
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Process all files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    if (previews.length === 0) return;
    setLoading(true);
    try {
      const data = await analyzeImage(previews);
      const id = await addMock(previews, data);
      navigate(`/mock/${id}`);
    } catch (err) {
      alert("Failed to analyze. Please try again or check your API Key.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Add New Mock</h2>
        
        <div className="bg-white rounded-xl shadow-things border border-things-border p-8">
          {/* Upload Area */}
          <div className="mb-8">
             <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-things-blue transition group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <Upload className="w-10 h-10 text-gray-400 group-hover:text-things-blue mb-3 transition" />
                  <p className="text-sm text-gray-500 font-medium">Click to upload screenshots</p>
                  <p className="text-xs text-gray-400 mt-1">Upload Question, Options, and Explanation images together.</p>
                </div>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              </label>
          </div>

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
              {previews.map((src, idx) => (
                <div key={idx} className="relative group aspect-[3/4] rounded-lg overflow-hidden shadow-sm border border-gray-100">
                  <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={processImages}
            disabled={loading || previews.length === 0}
            className="w-full bg-things-blue text-white font-medium py-3 rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5"/> 
                <span>Analyzing multiple images...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                <span>Process {previews.length} Image{previews.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}