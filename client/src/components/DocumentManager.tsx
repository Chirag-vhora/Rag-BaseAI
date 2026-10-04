import React, { useState } from 'react';
import { DocumentMetadata, UserRole } from '../types';
import { uploadDocument, seedSamplePolicies, deleteDocument } from '../api';
import { Upload, Trash2, FileText, Sparkles, Shield, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useTilt } from '../hooks/useTilt';

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

  const uploadCardRef = useTilt<HTMLDivElement>(3);
  const rulesCardRef = useTilt<HTMLDivElement>(3);

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

  const selectClass =
    'w-full bg-[#151a30] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] transition-all duration-300';

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel glass-rim p-6 rounded-3xl">
        <div className="relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-cyan-300" />
            <span className="text-aurora">Company Knowledge Base Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload company policies (PDF, DOCX, TXT) to index into the RAG Vector Database with
            Role-Based Access Control.
          </p>
        </div>

        <button
          onClick={handleSeedSamples}
          disabled={isSeeding}
          className="btn-liquid relative z-10 flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-xs disabled:opacity-50 shrink-0"
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
        <div
          ref={uploadCardRef}
          className="md:col-span-2 tilt tilt-glare glass-panel p-5 rounded-3xl space-y-4"
        >
          <h3 className="relative z-10 text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Upload className="h-4 w-4 text-indigo-300" />
            Upload New Document
          </h3>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Target Access Level:
              </label>
              <select
                value={uploadRole}
                onChange={(e) => setUploadRole(e.target.value as any)}
                className={selectClass}
              >
                <option value="all">All Employees (Public Policy)</option>
                <option value="hr_admin">HR / Admin Only (Restricted)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Policy Category:
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className={selectClass}
              >
                <option value="leave">Leave &amp; Holidays</option>
                <option value="attendance">Attendance &amp; Remote Work</option>
                <option value="benefits">Health &amp; Benefits</option>
                <option value="compensation">Compensation &amp; Review</option>
                <option value="handbook">Employee Handbook</option>
                <option value="general">General HR Rules</option>
              </select>
            </div>
          </div>

          <label className="drop-liquid relative z-10 border border-dashed border-white/15 rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-indigo-300 animate-spin" />
                <span className="text-xs text-indigo-200 font-medium">
                  Extracting text &amp; generating vector chunks...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 rounded-full bg-[#312e81] border border-[#6366f1]/50 text-indigo-100 shadow-lg shadow-indigo-950/70">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to select or drag PDF, DOCX, or TXT document
                </p>
                <p className="text-[10px] text-slate-400">
                  Files will be automatically chunked and vectorized for RAG Q&amp;A
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Info & Stats Summary */}
        <div
          ref={rulesCardRef}
          className="tilt tilt-glare glass-panel p-5 rounded-3xl space-y-4 flex flex-col justify-between"
        >
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-300" />
              Role-Based Knowledge Rules
            </h3>
            <div className="mt-3 space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2 bg-[#090c1a] p-2.5 rounded-xl border border-white/10">
                <span className="px-1.5 py-0.5 text-[10px] bg-[#065f46] text-emerald-50 font-bold rounded-md border border-[#10b981]/50">
                  Employee
                </span>
                <span>Can query general leave policies, attendance rules, and wellness benefits.</span>
              </div>
              <div className="flex items-start gap-2 bg-[#090c1a] p-2.5 rounded-xl border border-white/10">
                <span className="px-1.5 py-0.5 text-[10px] bg-[#4c1d95] text-violet-50 font-bold rounded-md border border-[#8b5cf6]/50">
                  HR Admin
                </span>
                <span>Can query all documents including executive salary reviews &amp; escalation protocols.</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Indexed Documents:</span>
            <span className="font-bold text-cyan-50 bg-[#164e63] px-2.5 py-1 rounded-lg border border-[#22d3ee]/50 tabular-nums">
              {documents.length}
            </span>
          </div>
        </div>

      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-[#7f1d1d] border border-[#fb7185]/50 text-red-50 rounded-2xl text-xs flex items-center gap-2 fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-[#064e3b] border border-[#34d399]/50 text-emerald-50 rounded-2xl text-xs flex items-center gap-2 fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Document List Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="relative z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#151a30]">
          <h3 className="text-sm font-bold text-white">Indexed Policy Documents</h3>
          <button
            onClick={onRefresh}
            className="btn-ghost px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3 relative z-10">
            <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center bg-[#151a30] border border-white/10">
              <FileText className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-sm font-medium">No documents in knowledge base yet.</p>
            <p className="text-xs text-slate-500">
              Upload a policy document above or click "Seed Sample Policy Suite" to load sample
              documents.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full min-w-[720px] text-left text-xs text-slate-300">
              <thead className="bg-[#151a30] text-slate-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="px-4 py-3.5">Document Name</th>
                  <th className="px-3 py-3.5 hidden lg:table-cell">Category</th>
                  <th className="px-3 py-3.5">Access Level</th>
                  <th className="px-3 py-3.5">Chunks</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5 hidden lg:table-cell">Upload Date</th>
                  <th className="px-3 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {documents.map((doc, rowIdx) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[#1b2140] transition-colors duration-300 fade-up"
                    style={{ animationDelay: `${Math.min(rowIdx, 8) * 0.03}s` }}
                  >
                    <td className="px-3 py-4 font-medium text-slate-100">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-300 shrink-0" />
                        <span className="truncate max-w-[190px]">{doc.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-4 hidden lg:table-cell">
                      <span className="capitalize px-2 py-0.5 rounded-lg bg-[#1b2140] text-slate-300 border border-white/10 whitespace-nowrap">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {doc.targetRole === 'hr_admin' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[#4c1d95] text-violet-50 border border-[#8b5cf6]/50 font-semibold flex items-center gap-1 w-fit whitespace-nowrap">
                          <Shield className="h-3 w-3" /> HR Admin Only
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-[#065f46] text-emerald-50 border border-[#10b981]/50 font-semibold w-fit inline-block whitespace-nowrap">
                          All Employees
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 font-mono tabular-nums">{doc.chunkCount}</td>
                    <td className="px-3 py-4">
                      {doc.status === 'indexed' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#064e3b] text-emerald-50 border border-[#10b981]/50 text-[10px] font-bold whitespace-nowrap">
                          Indexed &amp; Ready
                        </span>
                      ) : doc.status === 'processing' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#78350f] text-amber-50 border border-[#f59e0b]/50 text-[10px] font-bold animate-pulse whitespace-nowrap">
                          Processing...
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#7f1d1d] text-red-50 border border-[#fb7185]/50 text-[10px] font-bold whitespace-nowrap">
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-400 hidden lg:table-cell">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="p-1.5 text-slate-400 hover:text-red-200 hover:bg-[#7f1d1d] rounded-lg transition-all duration-300"
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
