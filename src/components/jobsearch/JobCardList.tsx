"use client";

import JobCard from "./JobCard";

export default function JobCardList() {
  // Placeholder jobs
  const jobs = [
    { id: 1, title: "Frontend Engineer", company: "Acme Corp", location: "Remote", match: 92 },
    { id: 2, title: "Backend Developer", company: "Beta Inc", location: "New York", match: 88 },
  ];
  return (
    <div className="flex flex-col gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
