"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import MetricWidget from "@/components/dashboard/MetricWidget";
import Badge from "@/components/ui/Badge";
import {
  fallbackRecruiterDashboard,
  type RecruiterDashboardCandidate,
  type RecruiterDashboardJob,
  type RecruiterWorkflowImprovement,
} from "@/lib/fallback-data";

const dashboardData = fallbackRecruiterDashboard;

const priorityVariant: Record<"High" | "Medium" | "Low", "error" | "warning" | "neutral"> = {
  High: "error",
  Medium: "warning",
  Low: "neutral",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function ImprovementList({ items }: { items: RecruiterWorkflowImprovement[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={`${item.label}-${item.status}`} className="flex gap-3 text-sm">
          <span className="mt-1.5 inline-flex h-2 w-2 flex-none rounded-full bg-primary" />
          <div>
            <p className="font-medium text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">
              {item.status}
              {item.completedAt ? ` · ${formatDate(item.completedAt)}` : ""}
              {item.impact ? ` · ${item.impact}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CandidateCard({ candidate, rank }: { candidate: RecruiterDashboardCandidate; rank: number }) {
  return (
    <Card hoverable>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Rank {rank}</p>
            <h4 className="text-base font-semibold text-foreground">{candidate.name}</h4>
            <p className="text-sm text-muted-foreground">{candidate.currentRole}</p>
            <p className="text-xs text-muted-foreground">{candidate.location}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Match</p>
              <p className="text-lg font-bold text-secondary">{candidate.matchScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Bias-free</p>
              <p className="text-lg font-bold text-primary">{candidate.biasFreeScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Priority</p>
              <Badge variant={priorityVariant[candidate.priority]}>{candidate.priority}</Badge>
            </div>
          </div>
        </div>

        {candidate.mustMatchFlags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.mustMatchFlags.map(flag => (
              <Badge key={flag} variant="info" size="sm">Must match: {flag}</Badge>
            ))}
          </div>
        )}

        <p className="mt-3 text-sm text-foreground">
          <span className="font-medium">Key skills:</span>{" "}
          <span className="text-muted-foreground">{candidate.keySkills.join(", ")}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{candidate.status}</p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">Recruiter priority: {candidate.recruiterPriority}</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Last activity: {candidate.lastActivity}</p>
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Commitment & ranking improvements
          </p>
          <ImprovementList items={candidate.improvementJourney} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function RecruiterDashboardPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>(dashboardData.jobs[0]?.jobId ?? "");

  const selectedJob = useMemo<RecruiterDashboardJob | undefined>(
    () => dashboardData.jobs.find(job => job.jobId === selectedJobId),
    [selectedJobId],
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Recruiter Dashboard</h1>
          <p className="text-muted-foreground max-w-3xl">
            Monitor live job profiles, surface AI-ranked candidates, and track applicant improvement over time.
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardData.summaryMetrics.map((metric, i) => (
            <MetricWidget
              key={metric.label}
              title={metric.label}
              value={metric.value}
              subtitle={metric.helper}
              variant={["default", "success", "info", "warning"][i % 4] as "default" | "success" | "info" | "warning"}
            />
          ))}
        </div>

        {/* Job Profiles */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">Job Profiles</h2>
            <div className="flex flex-wrap gap-2">
              {dashboardData.jobs.map(job => {
                const isActive = job.jobId === selectedJobId;
                return (
                  <button
                    key={job.jobId}
                    type="button"
                    onClick={() => setSelectedJobId(job.jobId)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? "border-primary bg-primary-light text-primary-dark"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {job.title}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedJob && (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{selectedJob.priority}</Badge>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{selectedJob.status}</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">{selectedJob.title}</h3>
                    <p className="text-muted-foreground">{selectedJob.location} · {selectedJob.contractType}</p>
                    <p className="text-sm text-muted-foreground">Hiring manager: {selectedJob.hiringManager}</p>
                    <p className="text-sm text-muted-foreground">Published: {formatDate(selectedJob.publishedAt)}</p>
                    {selectedJob.notes && <p className="text-sm text-muted-foreground">{selectedJob.notes}</p>}
                  </div>

                  <div className="space-y-3 min-w-[260px]">
                    <div className="p-4 bg-muted rounded-lg space-y-1.5 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Filters</p>
                      {[
                        ["Skills", selectedJob.filters.skills.join(", ")],
                        ["Locations", selectedJob.filters.locations.join(", ")],
                        ["Experience", selectedJob.filters.experience],
                        ["Remote", selectedJob.filters.remoteFriendly ? "Yes" : "No"],
                        ["Must match", selectedJob.filters.mustMatch.join(", ")],
                      ].map(([label, val]) => (
                        <p key={label}><span className="font-medium text-foreground">{label}:</span> <span className="text-muted-foreground">{val}</span></p>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Applicants", value: selectedJob.metrics.totalApplicants, cls: "bg-blue-50 border-blue-100 text-blue-900" },
                        { label: "Recommended", value: selectedJob.metrics.recommended, cls: "bg-emerald-50 border-emerald-100 text-emerald-900" },
                        { label: "Interviews", value: selectedJob.metrics.interviews, cls: "bg-amber-50 border-amber-100 text-amber-900" },
                        { label: "Improvements", value: selectedJob.metrics.improvementCount, cls: "bg-purple-50 border-purple-100 text-purple-900" },
                      ].map(m => (
                        <div key={m.label} className={`rounded-lg border p-3 ${m.cls}`}>
                          <p className="text-xs font-semibold">{m.label}</p>
                          <p className="text-2xl font-bold">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground">Recommended Shortlist</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedJob.recommendedCandidates.map((candidate, index) => (
                        <CandidateCard key={candidate.id} candidate={candidate} rank={index + 1} />
                      ))}
                    </div>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Next Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedJob.nextSteps.map(step => (
                          <li key={step} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 inline-flex h-2 w-2 flex-none rounded-full bg-primary" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Applicant Database */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Applicant Database</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Browse every applicant surfaced by the AI engine, sorted by recruiter-defined priority.
            </p>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Candidate", "Match", "Bias-free", "Priority", "Must match", "Recent improvement", "Last activity"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboardData.applicantDatabase.map(candidate => {
                    const latestImprovement = candidate.improvementJourney[0];
                    return (
                      <tr key={candidate.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-foreground">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.currentRole}</p>
                          <p className="text-xs text-muted-foreground">{candidate.location}</p>
                        </td>
                        <td className="px-4 py-4 font-bold text-secondary">{candidate.matchScore}</td>
                        <td className="px-4 py-4 font-bold text-primary">{candidate.biasFreeScore}</td>
                        <td className="px-4 py-4">
                          <Badge variant={priorityVariant[candidate.priority]}>{candidate.priority}</Badge>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">{candidate.mustMatchFlags.join(", ")}</td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">
                          {latestImprovement ? `${latestImprovement.label} · ${latestImprovement.status}` : "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">{candidate.lastActivity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
