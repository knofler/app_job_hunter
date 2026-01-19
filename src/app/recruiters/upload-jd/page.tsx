"use client";

import { useState, useEffect } from "react";

interface JobDescription {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  jd_content: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  employment_type?: string;
  salary_range?: string;
  code: string;
  uploaded_at: string;
  updated_at?: string;
}

interface JobPreviewModalProps {
  job: JobDescription | null;
  onClose: () => void;
}

function formatPreviewText(text: string): string {
  if (!text) return "";

  return text
    // Remove excessive whitespace and normalize line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Fix spacing around punctuation
    .replace(/\s+([.!?])/g, '$1')
    // Ensure proper spacing after punctuation
    .replace(/([.!?])([A-Z])/g, '$1\n\n$2')
    // Clean up bullet points and lists
    .replace(/•/g, '• ')
    .replace(/\*\s*/g, '• ')
    .replace(/-\s*/g, '• ')
    // Remove excessive spaces
    .replace(/ {2,}/g, ' ')
    .trim();
}

function JobPreviewModal({ job, onClose }: JobPreviewModalProps) {
  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
              <p className="text-lg text-gray-600 mt-1">{job.company}</p>
              <p className="text-sm text-gray-500 mt-1">Job Code: {job.code}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {job.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                {job.location && (
                  <div>
                    <span className="font-medium">Location:</span> {job.location}
                  </div>
                )}
                {job.employment_type && (
                  <div>
                    <span className="font-medium">Employment Type:</span> {job.employment_type}
                  </div>
                )}
                {job.salary_range && (
                  <div>
                    <span className="font-medium">Salary Range:</span> {job.salary_range}
                  </div>
                )}
                <div>
                  <span className="font-medium">Uploaded:</span>{" "}
                  {new Date(job.uploaded_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {job.jd_content && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Job Description Content</h3>
                <div className="bg-gray-50 p-6 rounded-lg border max-h-96 overflow-y-auto">
                  <div className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
                    {formatPreviewText(job.jd_content)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function fetchJobDescriptions(): Promise<{ items: JobDescription[]; total: number }> {
  const response = await fetch('/api/recruiters/jobs');
  if (!response.ok) {
    throw new Error('Failed to fetch job descriptions');
  }
  return response.json();
}

async function uploadJobDescription(formData: FormData): Promise<{ job_id: string; message: string }> {
  const response = await fetch('/api/jobs/upload-jd', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to upload job description');
  }
  return response.json();
}

export default function RecruiterJobUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    budget: '',
    job_brief: '',
  });

  // Load job descriptions on mount
  useEffect(() => {
    loadJobDescriptions();
  }, []);

  const loadJobDescriptions = async () => {
    try {
      setLoading(true);
      const data = await fetchJobDescriptions();
      setJobDescriptions(data.items);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to load job descriptions");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (job: JobDescription) => {
    setSelectedJob(job);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setError(null);
    setSuccessMessage(null);

    if (!formData.title.trim()) {
      setError("Job title is required");
      return;
    }
    if (!formData.company.trim()) {
      setError("Company name is required");
      return;
    }
    if (!selectedFile) {
      setError("Please select a job description file");
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title.trim());
      uploadFormData.append('company', formData.company.trim());
      uploadFormData.append('file', selectedFile);

      if (formData.budget?.trim()) {
        uploadFormData.append('budget', formData.budget.trim());
      }
      if (formData.job_brief?.trim()) {
        uploadFormData.append('job_brief', formData.job_brief.trim());
      }

      const result = await uploadJobDescription(uploadFormData);
      setSuccessMessage(result.message);

      // Reset form
      setFormData({
        title: '',
        company: '',
        budget: '',
        job_brief: '',
      });
      setSelectedFile(null);

      // Reload job descriptions
      await loadJobDescriptions();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to upload job description");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Job Description Upload</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          Upload job descriptions to find matching candidates. The system will automatically extract content from PDF or DOCX files.
        </p>
      </header>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {successMessage && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upload Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload New Job Description</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Job Title *
                <input
                  type="text"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Senior Software Engineer"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Company *
                <input
                  type="text"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="TechCorp Inc."
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Budget/Salary Range
              <input
                type="text"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="$120,000 - $150,000"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Job Brief
              <textarea
                rows={3}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={formData.job_brief}
                onChange={(e) => setFormData(prev => ({ ...prev, job_brief: e.target.value }))}
                placeholder="Brief overview of the role and team..."
              />
            </label>
            <div className="flex flex-col gap-1 text-sm text-gray-700">
              <span>Job Description File *</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                className="border border-gray-300 rounded px-2 py-2"
              />
              {selectedFile && (
                <span className="text-xs text-gray-500 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
              {!selectedFile && (
                <span className="text-xs text-gray-500 mt-1">
                  Choose a PDF/DOCX/TXT file — the selected file name will appear here.
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Job Description'}
            </button>
          </form>
        </div>

        {/* Recent Uploads */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Job Descriptions</h2>
          {jobDescriptions.length === 0 ? (
            <p className="text-sm text-gray-500">No job descriptions uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {jobDescriptions.slice(0, 5).map(job => (
                <div key={job.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(job.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.skills && job.skills.length > 0 ? (
                      <>
                        {job.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="text-xs text-gray-500">+{job.skills.length - 3} more</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">No skills specified</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(job)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Preview
                    </button>
                    <a
                      href={`/jobs/${job.id}`}
                      className="text-green-600 hover:text-green-900 text-sm font-medium"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <JobPreviewModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}