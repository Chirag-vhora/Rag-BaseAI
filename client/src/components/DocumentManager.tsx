import React, { useState } from 'react';
import { DocumentMetadata, UserRole } from '../types';
import { uploadDocument, seedSamplePolicies, deleteDocument } from '../api';
import { Upload, Trash2, FileText, Sparkles, Shield, CheckCircle2, AlertCircle, Loader2, RefreshCw, PlusCircle } from 'lucide-react';

interface DocumentManagerProps {
  documents: DocumentMetadata[];
  onRefresh: () => void;
  activeRole: UserRole;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, onRefresh, activeRole }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [uploadRole, setUploadRole] = useState<UserRole | 'all'>('all');
  const [uploadCategory, setUploadCategory] = useState<string>('general');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadDocument(files[i], uploadRole, uploadCategory);
      }
      setSuccessMsg(`Successfully processed ${files.length} document(s) into RAG vector store.`);
      onRefresh();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSeedSamples = async () => {
    setIsSeeding(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await seedSamplePolicies();
      setSuccessMsg(`Seeded ${res.seededCount} realistic sample company policies into vector database.`);
      onRefresh();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" and remove all its vector embeddings?`)) return;

    try {
      await deleteDocument(id);
      setSuccessMsg(`Deleted document "${name}" and purged associated vectors.`);
      onRefresh();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-400" />
            Company Knowledge Base Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload company policies (PDF, DOCX, TXT) to index into the RAG Vector Database with Role-Based Access Control.
          </p>
        </div>

        <button
          onClick={handleSeedSamples}
          disabled={isSeeding}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 shrink-0"
        >
          {isSeeding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Seed Sample Policy Suite
        </button>
      </div>

      {/* Upload & Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Upload Drop Zone Card */}
        <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-400" />
            Upload New Document
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Access Level:</label>
              <select
                value={uploadRole}
                onChange={(e) => setUploadRole(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Employees (Public Policy)</option>
                <option value="hr_admin">HR / Admin Only (Restricted)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Policy Category:</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="leave">Leave & Holidays</option>
                <option value="attendance">Attendance & Remote Work</option>
                <option value="benefits">Health & Benefits</option>
                <option value="compensation">Compensation & Review</option>
                <option value="handbook">Employee Handbook</option>
                <option value="general">General HR Rules</option>
              </select>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                <span className="text-xs text-blue-400 font-medium">Extracting text & generating vector chunks...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-400">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to select or drag PDF, DOCX, or TXT document
                </p>
                <p className="text-[10px] text-slate-400">
                  Files will be automatically chunked and vectorized for RAG Q&A
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Info & Stats Summary */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              Role-Based Knowledge Rules
            </h3>
            <div className="mt-3 space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 font-bold rounded">Employee</span>
                <span>Can query general leave policies, attendance rules, and wellness benefits.</span>
              </div>
              <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/10 text-purple-400 font-bold rounded">HR Admin</span>
                <span>Can query all documents including executive salary reviews & escalation protocols.</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Indexed Documents:</span>
            <span className="font-bold text-white bg-blue-600/20 px-2 py-0.5 rounded text-blue-300">
              {documents.length}
            </span>
          </div>
        </div>

      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Document List Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Indexed Policy Documents</h3>
          <button
            onClick={onRefresh}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No documents in knowledge base yet.</p>
            <p className="text-xs text-slate-500">Upload a policy document above or click "Seed Sample Policy Suite" to load sample documents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Document Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Access Level</th>
                  <th className="px-4 py-3">Chunks</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Upload Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="px-6 py-4 font-medium text-slate-100 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {doc.targetRole === 'hr_admin' ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" /> HR Admin Only
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold w-fit inline-block">
                          All Employees
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono">{doc.chunkCount}</td>
                    <td className="px-4 py-4">
                      {doc.status === 'indexed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Indexed & Ready
                        </span>
                      ) : doc.status === 'processing' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold animate-pulse">
                          Processing...
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                        title="Delete document and purge vectors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
