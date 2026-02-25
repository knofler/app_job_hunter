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
    description?: string;
  };
}

function MatchScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? "text-emerald-600" : score >= 70 ? "text-blue-600" : "text-amber-600";
  const bg = score >= 85 ? "bg-emerald-50 border-emerald-200" : score >= 70 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200";
  return (
    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 ${bg} shrink-0`}>
      <span className={`text-lg font-bold leading-none ${color}`}>{Math.round(score)}</span>
      <span className={`text-[9px] font-semibold ${color} uppercase tracking-wide`}>match</span>
    </div>
  );
}

export default function JobCard({ job }: JobCardProps) {
  const matchScore = job.match_score ?? 0;
  const postedDate = job.posted_at
    ? new Date(job.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const initials = job.company
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="group bg-card border border-border rounded-xl p-5 flex gap-4 items-start hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer">
      {/* Company Logo Placeholder */}
      <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
        {initials}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
          </div>
          {matchScore > 0 && <MatchScoreRing score={matchScore} />}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {/* Location */}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>

          {job.employment_type && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground border border-border">
              {job.employment_type}
            </span>
          )}

          {job.salary_range && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {job.salary_range}
            </span>
          )}

          {postedDate && (
            <span className="text-xs text-muted-foreground ml-auto">{postedDate}</span>
          )}
        </div>

        {job.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        )}
      </div>
    </div>
  );
}
