"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from "react";

interface UserWithRoles {
  [key: string]: unknown;
  'https://ai-job-hunter/roles'?: string[];
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
  skills: string[];
  responsibilities: string[];
  requirements: string[];
  budget?: string;
  job_brief?: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface JobUploadFormData {
  title: string;
  company: string;
  budget?: string;
  job_brief?: string;
}

async function fetchJobDescriptions(): Promise<{ items: JobDescription[]; total: number; page: number; page_size: number }> {
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
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<JobUploadFormData>({
    title: '',
    company: '',
    budget: '',
    job_brief: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Auth check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/api/auth/login?returnTo=/recruiters/upload-jd');
      return;
    }

    const roles = ((user as UserWithRoles)?.['https://ai-job-hunter/roles'] || []) as string[];
    if (!roles.includes('recruiter')) {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    loadJobDescriptions();
  }, [authLoading, user]);

  const loadJobDescriptions = async () => {
    try {
      setLoading(true);
      const data = await fetchJobDescriptions();
      setJobDescriptions(data.items);
      setError(null);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to load job descriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    if (!uploadFile) {
      setError("Please select a job description file");
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title.trim());
      uploadFormData.append('company', formData.company.trim());
      uploadFormData.append('file', uploadFile);

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
      setUploadFile(null);

      // Reload job descriptions
      await loadJobDescriptions();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to upload job description");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || !user || loading) {
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
          <form onSubmit={handleUpload} className="space-y-4">
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
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Job Description File *
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx,.txt"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <span className="text-xs text-gray-500 mt-1">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
            </label>
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
                  {job.budget && (
                    <p className="text-sm text-green-700 font-medium mb-2">{job.budget}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="text-xs text-gray-500">+{job.skills.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}