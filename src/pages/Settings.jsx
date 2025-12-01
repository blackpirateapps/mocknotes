import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  getApiKey, setApiKey, 
  getAvailableModels, getModelId, setModelId 
} from '../lib/gemini';
import { exportData, importData } from '../lib/backup';
import { db } from '../lib/db';
import { 
  Save, Download, Upload, Check, Loader2, Trash2, 
  Cpu, RefreshCw 
} from 'lucide-react';

export default function Settings() {
  // API Key State
  const [key, setKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('');
  
  // Model State
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState('');

  // Data State
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setKey(getApiKey());
    setSelectedModel(getModelId());
  }, []);

  const handleSaveKey = () => {
    setApiKey(key);
    setKeyStatus('saved');
    setTimeout(() => setKeyStatus(''), 2000);
    // Optionally fetch models automatically after saving key
    handleFetchModels();
  };

  const handleFetchModels = async () => {
    setLoadingModels(true);
    setModelError('');
    try {
      const available = await getAvailableModels();
      setModels(available);
      // If current selected model isn't in list, might want to warn or keep as is
    } catch (err) {
      setModelError(err.message);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = (e) => {
    const val = e.target.value;
    setSelectedModel(val);
    setModelId(val);
  };

  const handleExport = async () => {
    setLoadingData(true);
    try {
      await exportData();
    } catch (e) {
      alert("Export failed: " + e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if(!confirm("Importing will add new mocks to your existing list. Continue?")) return;

    setLoadingData(true);
    try {
      const count = await importData(file);
      alert(`Successfully imported ${count} mocks!`);
    } catch (e) {
      alert("Import failed: " + e.message);
    } finally {
      setLoadingData(false);
      e.target.value = null;
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
                {keyStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Model Selection Section */}
        <section className="bg-white rounded-xl shadow-things p-6 border border-things-border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
            Model Selection
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Select the AI model used for analysis.</p>
              <button 
                onClick={handleFetchModels}
                disabled={loadingModels || !key}
                className="text-xs flex items-center gap-1 text-things-blue hover:underline disabled:text-gray-400"
              >
                <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
                {models.length > 0 ? 'Refresh List' : 'Check Availability'}
              </button>
            </div>

            {modelError && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                {modelError}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Cpu className="h-4 w-4 text-gray-400" />
              </div>
              
              {models.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-things-blue focus:border-things-blue bg-things-bg"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={selectedModel}
                  onChange={handleModelChange}
                  placeholder="e.g. gemini-1.5-flash"
                  className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-things-blue focus:border-things-blue bg-things-bg"
                />
              )}
            </div>
            
            <p className="text-xs text-gray-400">
              Current Model: <span className="font-mono text-gray-600">{selectedModel}</span>
            </p>
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
              disabled={loadingData}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition group"
            >
              <Download className="w-8 h-8 text-gray-400 group-hover:text-things-blue mb-2 transition" />
              <span className="font-medium text-gray-700">Export Backup</span>
              <span className="text-xs text-gray-400 mt-1">Download ZIP</span>
            </button>

            {/* Import */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition group cursor-pointer">
              {loadingData ? (
                <Loader2 className="w-8 h-8 text-things-blue animate-spin mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500 mb-2 transition" />
              )}
              <span className="font-medium text-gray-700">Import Backup</span>
              <span className="text-xs text-gray-400 mt-1">Restore from ZIP</span>
              <input type="file" className="hidden" accept=".zip" onChange={handleImport} disabled={loadingData} />
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