"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchFromApi } from "@/lib/api";

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
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ').replace(/•/g, '• ').replace(/•  +/g, '• ')
    .replace(/([.!?])([A-Z])/g, '$1\n\n$2').trim();
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
              <p className="text-sm text-muted-foreground mt-1">Job Code: <span className="font-mono">{job.code}</span></p>
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
            {job.responsibilities?.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {job.requirements?.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
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
            <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-sm">
              {job.location && <div><span className="font-medium text-foreground">Location:</span> <span className="text-muted-foreground">{job.location}</span></div>}
              {job.employment_type && <div><span className="font-medium text-foreground">Type:</span> <span className="text-muted-foreground">{job.employment_type}</span></div>}
              {job.salary_range && <div><span className="font-medium text-foreground">Salary:</span> <span className="text-muted-foreground">{job.salary_range}</span></div>}
              <div><span className="font-medium text-foreground">Uploaded:</span> <span className="text-muted-foreground">{new Date(job.uploaded_at).toLocaleDateString()}</span></div>
            </div>
            {job.jd_content && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Full Job Description</h3>
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

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFromApi<{ items: JobDescription[]; total: number }>("/recruiters/jobs?page=1&page_size=100");
      setJobs(response.items);
    } catch (err) {
      console.error("Failed to load jobs", err);
      setError("Failed to load job descriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (job: JobDescription) => {
    if (!confirm(`Delete "${job.title}"?`)) return;
    try {
      await fetchFromApi(`/jobs/${job.id}`, { method: "DELETE" });
      setJobs(jobs.filter(j => j.id !== job.id));
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job description");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Job Descriptions</h1>
            <p className="text-muted-foreground">Manage your uploaded job descriptions</p>
          </div>
          <Button variant="primary" onClick={() => window.location.href = '/recruiters/upload-jd'}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload New JD
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by title, company, or job code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
          <Button variant="outline" onClick={loadJobs}>Refresh</Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-error font-medium mb-4">{error}</p>
              <Button variant="outline" onClick={loadJobs}>Try Again</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Job Details", "Company", "Code", "Uploaded", "Actions"].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{job.title}</p>
                        {job.location && <p className="text-xs text-muted-foreground mt-0.5">{job.location}</p>}
                      </td>
                      <td className="px-6 py-4 text-foreground">{job.company || "—"}</td>
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{job.code}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(job.uploaded_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedJob(job)}>Preview</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(job)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredJobs.length === 0 && (
                <div className="py-16 text-center">
                  <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "No jobs match your search." : "No job descriptions uploaded yet."}
                  </p>
                  <Button variant="primary" onClick={() => window.location.href = '/recruiters/upload-jd'}>
                    Upload Your First JD
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
      <JobPreviewModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
