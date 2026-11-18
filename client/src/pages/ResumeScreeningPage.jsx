import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import {
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Briefcase,
  GraduationCap,
  FileCode2,
  Award
} from 'lucide-react';

export default function ResumeScreeningPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(false);
  const [jobDescription, setJobDescription] = useState(
    'Looking for a Full Stack Developer with React, Node.js, MongoDB and REST API experience.'
  );
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/resumes');
      setCandidates(res.data.candidates || []);
    } catch (err) {
      console.error('Failed to load candidate list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleScreenResumes = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) {
      setError('Please select at least one resume file (PDF or DOCX).');
      return;
    }

    setError('');
    setScreening(true);

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    selectedFiles.forEach((file) => formData.append('resumes', file));

    try {
      const res = await api.post('/resumes/screen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFiles([]);
      fetchCandidates();
      if (res.data.candidates && res.data.candidates.length) {
        setActiveCandidate(res.data.candidates[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to screen resumes.');
    } finally {
      setScreening(false);
    }
  };

  const getScoreVariant = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resume Evaluation & Matching</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Upload resumes to run automated AI evaluations against job qualifications.
        </p>
      </div>

      {/* Setup Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-indigo-600" />
          Batch Resume Evaluation Setup
        </h2>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleScreenResumes} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Job Description & Qualifications
            </label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job description..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white font-medium transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border border-dashed border-slate-300 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-indigo-600 shadow-xs">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {selectedFiles.length ? `${selectedFiles.length} resume file(s) selected` : 'Select Candidate Resumes'}
                </p>
                <p className="text-[11px] text-slate-500 font-normal">PDF, DOCX, TXT formats supported</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                id="resumeInput"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="resumeInput"
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                Choose Resumes
              </label>

              <button
                type="submit"
                disabled={screening || !selectedFiles.length}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {screening ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Run AI Evaluation
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Evaluated Candidates Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" /> Screened Candidate Profiles
          </h3>
          <span className="text-xs font-medium text-slate-500">
            {candidates.length} Applicants
          </span>
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching candidate records..." />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No Resumes Screened Yet"
            description="Upload candidate resumes above to run automated AI matching."
            icon={FileCheck2}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Match Score</th>
                  <th className="px-5 py-3">Experience</th>
                  <th className="px-5 py-3">Key Skills</th>
                  <th className="px-5 py-3">Recommendation</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {candidates.map((cand) => (
                  <tr
                    key={cand._id || cand.id}
                    onClick={() => setActiveCandidate(cand)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {cand.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-slate-900 font-semibold">{cand.name}</span>
                          <span className="block text-[11px] font-normal text-slate-500">{cand.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={getScoreVariant(cand.matchScore)} size="sm">
                        {cand.matchScore}% Match
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {cand.experienceYears ? `${cand.experienceYears} yrs` : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cand.skills?.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-indigo-600">
                      {cand.recommendation}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1">
                        View Report <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Modal */}
      <Modal
        isOpen={!!activeCandidate}
        onClose={() => setActiveCandidate(null)}
        title="Candidate AI Evaluation Report"
        maxWidth="max-w-xl"
      >
        {activeCandidate && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                  {activeCandidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeCandidate.name}</h3>
                  <p className="text-slate-500">{activeCandidate.role || 'Software Applicant'}</p>
                </div>
              </div>
              <Badge variant={getScoreVariant(activeCandidate.matchScore)} size="md">
                {activeCandidate.matchScore}% Match
              </Badge>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1">
              <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Evaluation Summary
              </span>
              <p className="text-slate-700 leading-relaxed font-normal">{activeCandidate.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-0.5">Experience</span>
                <p className="text-slate-900 font-medium">{activeCandidate.experienceText}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-0.5">Education</span>
                <p className="text-slate-900 font-medium">{activeCandidate.education || 'Bachelor Degree'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
