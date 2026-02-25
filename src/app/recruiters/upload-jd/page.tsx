"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

function formatPreviewText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/([.!?])([A-Z])/g, '$1\n\n$2')
    .replace(/•/g, '• ').replace(/\*\s*/g, '• ').replace(/-\s*/g, '• ')
    .replace(/ {2,}/g, ' ').trim();
}

function JobPreviewModal({ job, onClose }: { job: JobDescription | null; onClose: () => void }) {
  if (!job) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{job.title}</h2>
              <p className="text-muted-foreground mt-1">{job.company}</p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">Code: {job.code}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
          </div>
          <div className="space-y-5">
            {job.description && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
            {job.skills?.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(s => <Badge key={s} variant="info">{s}</Badge>)}
                </div>
              </div>
            )}
            {job.jd_content && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Full Content</h3>
                <div className="bg-muted p-4 rounded-lg border border-border max-h-80 overflow-y-auto scrollbar-thin">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{formatPreviewText(job.jd_content)}</pre>
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
  if (!response.ok) throw new Error('Failed to fetch job descriptions');
  return response.json();
}

async function uploadJobDescription(formData: FormData): Promise<{ job_id: string; message: string }> {
  const response = await fetch('/api/jobs/upload-jd', { method: 'POST', body: formData });
  if (!response.ok) throw new Error('Failed to upload job description');
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
  const [formData, setFormData] = useState({ title: '', company: '', budget: '', job_brief: '' });

  const loadJobDescriptions = async () => {
    try {
      setLoading(true);
      const data = await fetchJobDescriptions();
      setJobDescriptions(data.items);
    } catch (err) {
      setError((err as Error).message || "Failed to load job descriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobDescriptions(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!formData.title.trim()) { setError("Job title is required"); return; }
    if (!formData.company.trim()) { setError("Company name is required"); return; }
    if (!selectedFile) { setError("Please select a job description file"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title.trim());
      fd.append('company', formData.company.trim());
      fd.append('file', selectedFile);
      if (formData.budget?.trim()) fd.append('budget', formData.budget.trim());
      if (formData.job_brief?.trim()) fd.append('job_brief', formData.job_brief.trim());

      const result = await uploadJobDescription(fd);
      setSuccessMessage(result.message);
      setFormData({ title: '', company: '', budget: '', job_brief: '' });
      setSelectedFile(null);
      await loadJobDescriptions();
    } catch (err) {
      setError((err as Error).message || "Failed to upload job description");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Upload Job Description</h1>
          <p className="text-muted-foreground max-w-3xl">
            Upload job descriptions to find matching candidates. Content is automatically extracted from PDF or DOCX files.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-none" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-none" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle>Upload New Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Job Title *
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Senior Software Engineer"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Company *
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.company}
                      onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="TechCorp Inc."
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Budget / Salary Range
                  <input
                    type="text"
                    className="input"
                    value={formData.budget}
                    onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="$120,000 – $150,000"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Job Brief
                  <textarea
                    rows={3}
                    className="input h-auto py-2 resize-none"
                    value={formData.job_brief}
                    onChange={e => setFormData(prev => ({ ...prev, job_brief: e.target.value }))}
                    placeholder="Brief overview of the role and team..."
                  />
                </label>
                <div className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  <span>Job Description File * <span className="text-muted-foreground font-normal">(PDF, DOCX, TXT)</span></span>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      selectedFile ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/50 bg-muted/30'
                    }`}
                    onClick={() => document.getElementById('jd-file-input')?.click()}
                  >
                    <svg className={`w-8 h-8 mx-auto mb-2 ${selectedFile ? 'text-primary' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {selectedFile ? (
                      <p className="text-sm text-primary font-medium">{selectedFile.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Drag and drop or <span className="text-primary">browse</span></p>
                    )}
                  </div>
                  <input
                    id="jd-file-input"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }}
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={uploading}>
                  {!uploading && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                  Upload Job Description
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : jobDescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No job descriptions uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobDescriptions.slice(0, 6).map(job => (
                    <div key={job.id} className="p-4 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                        <span className="text-xs text-muted-foreground">{new Date(job.uploaded_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{job.company}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {job.skills?.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="info" size="sm">{skill}</Badge>
                        ))}
                        {(job.skills?.length || 0) > 3 && (
                          <span className="text-xs text-muted-foreground">+{job.skills.length - 3} more</span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setSelectedJob(job)} className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                          Preview
                        </button>
                        <a href={`/jobs/${job.id}`} className="text-sm text-secondary hover:text-secondary-dark font-medium transition-colors">
                          View Details
                        </a>
                      </div>
                    </div>
                  ))}
                  {jobDescriptions.length > 6 && (
                    <a href="/recruiters/jobs" className="block text-center text-sm text-primary hover:text-primary-dark font-medium pt-2 transition-colors">
                      View all {jobDescriptions.length} job descriptions →
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <JobPreviewModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
