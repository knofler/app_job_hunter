"use client";

import Link from "next/link";

interface JobListingCardProps {
  job: {
    id: string;
    company: string;
    location: string;
    title: string;
    description?: string;
    employment_type?: string;
    salary_range?: string;
    posted_at?: string;
    code?: string;
  };
}

export default function JobListingCard({ job }: JobListingCardProps) {
  const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : null;

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
          <p className="text-gray-600 font-medium">{job.company}</p>
          {job.location && (
            <p className="text-gray-500 text-sm">{job.location}</p>
          )}
        </div>
        {job.code && (
          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
            {job.code}
          </span>
        )}
      </div>

      {job.description && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {job.description.length > 200 ? `${job.description.substring(0, 200)}...` : job.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {job.employment_type && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
            {job.employment_type}
          </span>
        )}
        {job.salary_range && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
            {job.salary_range}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        {postedDate && <span>Posted {postedDate}</span>}
        <span className="text-blue-600 font-medium">View Details →</span>
      </div>
      </div>
    </Link>
  );
}