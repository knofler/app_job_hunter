"use client";

export default function JobCard({ job }: { job: any }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
      <div>
        <div className="font-medium text-lg">{job.title}</div>
        <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
      </div>
      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{job.match}% Match</span>
    </div>
  );
}
