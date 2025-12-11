import React, { useState } from 'react';
import { Key, ExternalLink, Check, X, ShieldAlert } from 'lucide-react';
import { setStoredApiKey } from '../services/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      setStoredApiKey(apiKey.trim());
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 transform transition-all scale-100 animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Key size={100} />
           </div>
           <h2 className="text-xl font-bold flex items-center gap-2 relative z-10">
             <Key size={20} />
             Setup API Key
           </h2>
           <p className="text-indigo-100 text-sm mt-1 relative z-10">
             To use JubitsGPT, you need a free Google Gemini API key.
           </p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Instructions */}
          <div className="space-y-3">
             <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
               This application is powered by Google's Gemini models. It requires an API Key to function.
               Don't worry, it's <strong>free</strong> for personal use!
             </p>
             
             <a 
               href="https://aistudio.google.com/app/apikey" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group text-sm"
             >
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">Get Free Gemini API Key</span>
                <ExternalLink size={16} className="text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
             </a>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label htmlFor="apiKey" className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Paste your API Key here
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-mono"
            />
            <p className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-500">
               <ShieldAlert size={10} />
               Your key is stored locally in your browser and never sent to our servers.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Save API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;