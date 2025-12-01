import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getApiKey, setApiKey } from '../lib/gemini';
import { exportData, importData } from '../lib/backup';
import { Save, Download, Upload, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { db } from '../lib/db';

export default function Settings() {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(''); // 'saved', 'error', ''
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setKey(getApiKey());
  }, []);

  const handleSaveKey = () => {
    setApiKey(key);
    setStatus('saved');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportData();
      setStatus('exported');
    } catch (e) {
      alert("Export failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if(!confirm("Importing will add new mocks to your existing list. Continue?")) return;

    setLoading(true);
    try {
      const count = await importData(file);
      alert(`Successfully imported ${count} mocks!`);
    } catch (e) {
      alert("Import failed: " + e.message);
    } finally {
      setLoading(false);
      e.target.value = null; // Reset input
    }
  };
  
  const handleClearDb = async () => {
      if(confirm("Are you sure? This will delete ALL your mocks permanently.")) {
          await db.mocks.clear();
          alert("Database cleared.");
      }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

        {/* API Key Section */}
        <section className="bg-white rounded-xl shadow-things p-6 border border-things-border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-things-blue rounded-full"></div>
            Gemini API Configuration
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Your API key is stored locally in your browser. 
              Get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-things-blue hover:underline">Google AI Studio</a>.
            </p>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter your AIza... key"
                className="flex-1 bg-things-bg border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-things-blue transition"
              />
              <button 
                onClick={handleSaveKey}
                className="bg-things-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition flex items-center gap-2"
              >
                {status === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="bg-white rounded-xl shadow-things p-6 border border-things-border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
            Data Management
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Export */}
            <button 
              onClick={handleExport}
              disabled={loading}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition group"
            >
              <Download className="w-8 h-8 text-gray-400 group-hover:text-things-blue mb-2 transition" />
              <span className="font-medium text-gray-700">Export Backup</span>
              <span className="text-xs text-gray-400 mt-1">Download ZIP (Images + Data)</span>
            </button>

            {/* Import */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition group cursor-pointer">
              {loading ? (
                <Loader2 className="w-8 h-8 text-things-blue animate-spin mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500 mb-2 transition" />
              )}
              <span className="font-medium text-gray-700">Import Backup</span>
              <span className="text-xs text-gray-400 mt-1">Restore from ZIP</span>
              <input type="file" className="hidden" accept=".zip" onChange={handleImport} disabled={loading} />
            </label>
          </div>
          
           <div className="mt-6 pt-6 border-t border-gray-100">
               <button onClick={handleClearDb} className="text-red-500 text-sm flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition">
                   <Trash2 className="w-4 h-4" />
                   Delete All Data
               </button>
           </div>
        </section>
      </div>
    </Layout>
  );
}