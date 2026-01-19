"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { fetchFromApi } from "@/lib/api";

interface JobDetail {
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
  posted_at: string;
  match_score?: number;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        setError(null);

        const jobData = await fetchFromApi<JobDetail>(`/jobs/${jobId}`);
        setJob(jobData);
      } catch (err) {
        console.error("Failed to load job", err);
        setError("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const handleApply = () => {
    // TODO: Implement apply functionality
    alert("Apply functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center">Loading job details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center text-red-600">{error || "Job not found"}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              <p className="text-xl text-blue-100 mb-1">{job.company}</p>
              <p className="text-blue-200">{job.location}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200 mb-1">Job Code: {job.code}</div>
              <div className="text-sm text-blue-200">
                Posted {new Date(job.posted_at).toLocaleDateString()}
              </div>
              {job.match_score && (
                <div className="mt-2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {Math.round(job.match_score)}% Match
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {job.employment_type && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">Employment Type</h3>
                <p className="text-gray-700">{job.employment_type}</p>
              </div>
            )}
            {job.salary_range && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">Salary Range</h3>
                <p className="text-gray-700">{job.salary_range}</p>
              </div>
            )}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
              <p className="text-gray-700">{job.location}</p>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {job.responsibilities.map((responsibility, index) => (
                  <li key={index}>{responsibility}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {job.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Job Description Content */}
          {job.jd_content && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Full Job Posting</h2>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {job.jd_content}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <div className="bg-gray-50 px-8 py-6 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Interested in this position? Apply now to get started.
            </div>
            <button
              onClick={handleApply}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply for this Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}