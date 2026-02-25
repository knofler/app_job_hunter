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
  const postedDate = job.posted_at
    ? new Date(job.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const initials = job.company.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
          </div>
          {job.code && (
            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border shrink-0">
              {job.code}
            </span>
          )}
        </div>

        {job.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3 leading-relaxed flex-1">
            {job.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.employment_type && (
            <span className="bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-full text-[11px] font-medium">
              {job.employment_type}
            </span>
          )}
          {job.salary_range && (
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
              {job.salary_range}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
          {postedDate ? <span>{postedDate}</span> : <span />}
          <span className="text-primary font-medium group-hover:underline">View Details →</span>
        </div>
      </div>
    </Link>
  );
}