"use client";

import { useCallback, useEffect, useState } from "react";

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

interface JobPreviewModalProps {
  job: JobDescription | null;
  onClose: () => void;
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Job Description Content</h3>
                <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{job.jd_content}</pre>
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

      const response = await fetchFromApi<{ items: JobDescription[]; total: number }>(
        "/recruiters/jobs?page=1&page_size=100"
      );

      setJobs(response.items);
    } catch (err) {
      console.error("Failed to load jobs", err);
      setError("Failed to load job descriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreview = (job: JobDescription) => {
    setSelectedJob(job);
  };

  const handleEdit = (job: JobDescription) => {
    // TODO: Implement edit functionality
    console.log("Edit job:", job.id);
  };

  const handleDelete = async (job: JobDescription) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) {
      return;
    }

    try {
      await fetchFromApi(`/jobs/${job.id}`, {
        method: "DELETE",
      });
      setJobs(jobs.filter(j => j.id !== job.id));
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job description");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="text-center">Loading job descriptions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Descriptions</h1>
        <p className="text-gray-600">Manage your uploaded job descriptions</p>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search by title, company, or job code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={loadJobs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      {job.location && (
                        <div className="text-sm text-gray-500">{job.location}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {job.company || "Not specified"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                    {job.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(job.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview(job)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleEdit(job)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? "No jobs match your search." : "No job descriptions uploaded yet."}
            </p>
            <a
              href="/recruiters/upload-jd"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Your First JD
            </a>
          </div>
        )}
      </div>

      <JobPreviewModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}