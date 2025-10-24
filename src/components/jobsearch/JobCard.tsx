"use client";

interface JobCardProps {
  job: {
    id: string;
    company: string;
    location: string;
    title: string;
    match_score?: number;
    employment_type?: string;
    salary_range?: string;
    posted_at?: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  const matchScore = job.match_score ?? 0;
  const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : null;

  return (
    <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center gap-6">
      <div className="flex-1">
        <div className="font-medium text-lg text-gray-900">{job.title}</div>
        <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
        <div className="text-xs text-gray-400 mt-1 flex gap-3">
          {job.employment_type && <span>{job.employment_type}</span>}
          {job.salary_range && <span>{job.salary_range}</span>}
          {postedDate && <span>Posted {postedDate}</span>}
        </div>
      </div>
      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{Math.round(matchScore)}% Match</span>
    </div>
  );
}
