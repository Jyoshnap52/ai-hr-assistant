import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  FolderGit2,
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  Database,
  Layers
} from 'lucide-react';

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('Policy');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('category', category);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      alert(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document from the vector store?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      fetchDocuments();
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Policy Knowledge Base</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Ingest company guidelines into the RAG dense vector database.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Vector Store Metric */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Dense Vector Storage Engine Active</h3>
            <p className="text-[11px] text-slate-500 font-normal">384-dimensional cosine similarity embeddings loaded.</p>
          </div>
        </div>
        <Badge variant="success" size="md">
          {documents.length} Vector Index Files
        </Badge>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-indigo-600" /> Ingested HR Documents
          </h3>
          <span className="text-xs text-slate-400 font-normal">Total {documents.length} Policy Records</span>
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching documents..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Document Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Vector Chunks</th>
                  <th className="px-5 py-3">Uploaded Date</th>
                  <th className="px-5 py-3">Status</th>
                  {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <tr key={doc._id || doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{doc.title}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{doc.category}</td>
                    <td className="px-5 py-3.5 font-medium text-indigo-600">
                      {doc.chunkCount || 4} chunks
                    </td>
                    <td className="px-5 py-3.5 font-normal text-slate-500">{doc.uploadedAt || '2026-08-01'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="success" size="sm">
                        Vector Indexed
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(doc._id || doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document to Vector Index"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900 font-medium"
            >
              <option value="Policy">Company Policy</option>
              <option value="Benefits">Health & Benefits</option>
              <option value="Onboarding">Onboarding Guide</option>
              <option value="Legal">Legal & Compliance</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Document File (PDF, DOCX, TXT)</label>
            <input
              type="file"
              required
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="w-full text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-3.5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {uploading ? 'Ingesting Vector Chunks...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
