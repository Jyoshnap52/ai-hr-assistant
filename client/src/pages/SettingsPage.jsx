import React, { useState } from 'react';
import Badge from '../components/common/Badge';
import {
  Settings2,
  Cpu,
  ShieldCheck,
  Save,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export default function SettingsPage() {
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(0.3);
  const [chunkSize, setChunkSize] = useState(500);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & AI Settings</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Configure LLM parameters, vector retrieval thresholds, and privacy shields.</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* LLM Engine Config */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" /> LLM Generation Engine
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700">Target Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B Instruct</option>
                <option value="local-in-memory-engine">Local High-Speed Synthesis Engine</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700">
                Sampling Temperature ({temperature})
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-[11px] text-slate-400 block">Lower temperature ensures factual policy responses.</span>
            </div>
          </div>
        </div>

        {/* Vector RAG Config */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" /> Vector Retrieval Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700">Chunk Character Limit ({chunkSize})</label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700">Similarity Metric</label>
              <input
                type="text"
                disabled
                value="Cosine Similarity (384 Dimensions)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Internal Security Shield Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security Shield Controls
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-900 block">PII Redaction Sanitizer</span>
                <span className="text-[11px] text-slate-500 font-normal">Redacts SSN, Credit Cards, and IBANs before processing</span>
              </div>
              <Badge variant="success" size="sm">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-900 block">Security Audit Logger</span>
                <span className="text-[11px] text-slate-500 font-normal">Immutable audit ledger stored at server/logs/audit_security.jsonl</span>
              </div>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
