"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface JobCardProps {
  job: {
    id: string;
    company?: string | null;
    location?: string | null;
    title: string;
    match_score?: number;
    matchScore?: number;
    match_details?: {
      score: number;
      matched_skills: string[];
      missing_skills: string[];
    };
    employment_type?: string;
    type?: string;
    salary_range?: string;
    salary?: string;
    posted_at?: string;
    postedAt?: string;
    description?: string;
    skills?: string[];
    applied?: boolean;
  };
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
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

export default function JobCard({ job, onApply, onViewDetails }: JobCardProps) {
  const matchScore = job.match_score ?? job.matchScore ?? 0;
  const matchDetails = job.match_details;
  
  const postedDate = job.posted_at
    ? new Date(job.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const initials = (job.company ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase() || "?";

  // Generate AI Insight
  const getAiInsight = () => {
    if (!matchDetails) return null;
    const matchedCount = matchDetails.matched_skills.length;
    const totalCount = matchedCount + matchDetails.missing_skills.length;
    
    if (matchScore >= 90) {
      return "Excellent match! Your profile aligns perfectly with the core requirements.";
    } else if (matchScore >= 70) {
      return `Good match. You have ${matchedCount}/${totalCount} core skills. Apply now to boost your chances!`;
    } else if (matchScore > 0) {
      return `Fair match. Adding ${matchDetails.missing_skills.slice(0, 2).join(", ")} to your resume could improve your score.`;
    }
    return null;
  };

  const aiInsight = getAiInsight();

  return (
    <div className="group bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <div className="flex gap-4 items-start">
        {/* Company Logo Placeholder */}
        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
          {initials}
        </div>

        {/* Header Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">{job.company}</p>
            </div>
            {matchScore > 0 && <MatchScoreRing score={matchScore} />}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            {/* Location */}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
            </span>

            {job.employment_type && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {job.employment_type}
              </span>
            )}

            {job.salary_range && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.salary_range}
              </span>
            )}

            {postedDate && (
              <span className="text-xs text-muted-foreground font-medium ml-auto">
                Posted {postedDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="flex flex-wrap gap-2 pt-1">
        {matchDetails ? (
          <>
            {matchDetails.matched_skills.map(skill => (
              <Badge key={skill} variant="primary" size="sm" className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {skill}
              </Badge>
            ))}
            {matchDetails.missing_skills.map(skill => (
              <Badge key={skill} variant="neutral" size="sm" className="flex items-center gap-1 opacity-70">
                <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {skill}
              </Badge>
            ))}
          </>
        ) : (
          job.skills?.map(skill => (
            <Badge key={skill} variant="neutral" size="sm">{skill}</Badge>
          ))
        )}
      </div>

      {/* Description Snippet */}
      {job.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
          "{job.description}"
        </p>
      )}

      {/* AI Insight Box */}
      {aiInsight && (
        <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="text-xs text-foreground leading-relaxed">
            <span className="font-bold text-primary mr-1">AI Insight:</span>
            {aiInsight}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border mt-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground h-8"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(job.id);
          }}
        >
          View Details
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs px-4"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement save functionality
          }}
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          className="h-8 text-xs px-6 font-bold"
          onClick={(e) => {
            e.stopPropagation();
            onApply?.(job.id);
          }}
          disabled={job.applied}
        >
          {job.applied ? "Applied" : "Apply Now"}
        </Button>
      </div>
    </div>
  );
}
