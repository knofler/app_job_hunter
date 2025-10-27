"use client";

import { useMemo, useState } from "react";

import {
  fallbackRecruiterDashboard,
  RecruiterDashboardCandidate,
  RecruiterDashboardJob,
  RecruiterWorkflowImprovement,
} from "@/lib/fallback-data";

const dashboardData = fallbackRecruiterDashboard;

const priorityClasses: Record<"High" | "Medium" | "Low", string> = {
  High: "bg-rose-100 text-rose-700 border-rose-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ImprovementList({ items }: { items: RecruiterWorkflowImprovement[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="space-y-2 text-sm text-gray-700">
      {items.map(item => (
        <li key={`${item.label}-${item.status}`} className="flex gap-3">
          <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-blue-400" />
          <div>
            <p className="font-medium text-gray-800">{item.label}</p>
            <p className="text-xs text-gray-500">
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rank {rank}</p>
          <h4 className="text-lg font-semibold text-gray-900">{candidate.name}</h4>
          <p className="text-sm text-gray-600">{candidate.currentRole}</p>
          <p className="text-xs text-gray-500">{candidate.location}</p>
        </div>
        <div className="flex flex-wrap items-end gap-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold text-gray-800">Match</span>
            <div className="text-lg font-bold text-blue-700">{candidate.matchScore}</div>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Bias-free</span>
            <div className="text-lg font-bold text-emerald-700">{candidate.biasFreeScore}</div>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Priority</span>
            <div
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${priorityClasses[candidate.priority]}`}
            >
              {candidate.priority}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {candidate.mustMatchFlags.map(flag => (
          <span
            key={flag}
            className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
          >
            Must match: {flag}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-700">Key skills: {candidate.keySkills.join(", ")}</p>
      <p className="mt-2 text-sm text-gray-600">{candidate.status}</p>
      <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        Recruiter priority: {candidate.recruiterPriority}
      </p>
      <p className="mt-2 text-xs text-gray-500">Last activity: {candidate.lastActivity}</p>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <h5 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Commitment & ranking improvements
        </h5>
        <ImprovementList items={candidate.improvementJourney} />
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>(dashboardData.jobs[0]?.jobId ?? "");

  const selectedJob = useMemo<RecruiterDashboardJob | undefined>(
    () => dashboardData.jobs.find(job => job.jobId === selectedJobId),
    [selectedJobId],
  );

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Recruiter dashboard</h1>
        <p className="text-gray-600 max-w-3xl">
          Monitor every live job profile, surface the AI-ranked candidates, and track how applicants improve their
          standing after assessments, upskilling, or deeper company research. This mirrors the promised recruiter
          workflow so we can wire real-time data later.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardData.summaryMetrics.map(metric => (
            <div key={metric.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p>
              {metric.helper && <p className="mt-1 text-sm text-gray-600">{metric.helper}</p>}
            </div>
          ))}
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Job profiles</h2>
          <div className="flex flex-wrap gap-2">
            {dashboardData.jobs.map(job => {
              const isActive = job.jobId === selectedJobId;
              return (
                <button
                  key={job.jobId}
                  type="button"
                  onClick={() => setSelectedJobId(job.jobId)}
                  className={`rounded-full border px-4 py-1 text-sm font-medium transition ${
                    isActive
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-200"
                  }`}
                >
                  {job.title}
                </button>
              );
            })}
          </div>
        </div>

        {selectedJob && (
          <article className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {selectedJob.priority}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{selectedJob.status}</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">{selectedJob.title}</h3>
                <p className="text-sm text-gray-600">{selectedJob.location} · {selectedJob.contractType}</p>
                <p className="text-xs text-gray-500">Hiring manager: {selectedJob.hiringManager}</p>
                <p className="text-xs text-gray-500">Published: {formatDate(selectedJob.publishedAt)}</p>
                {selectedJob.notes && <p className="text-sm text-gray-600">{selectedJob.notes}</p>}
              </div>
              <div className="grid gap-3 text-sm text-gray-600">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filters in play</p>
                  <p className="mt-1"><span className="font-semibold">Skills:</span> {selectedJob.filters.skills.join(", ")}</p>
                  <p className="mt-1"><span className="font-semibold">Locations:</span> {selectedJob.filters.locations.join(", ")}</p>
                  <p className="mt-1"><span className="font-semibold">Experience:</span> {selectedJob.filters.experience}</p>
                  <p className="mt-1"><span className="font-semibold">Remote friendly:</span> {selectedJob.filters.remoteFriendly ? "Yes" : "No"}</p>
                  <p className="mt-1"><span className="font-semibold">Must match flags:</span> {selectedJob.filters.mustMatch.join(", ")}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pipeline metrics</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-blue-800">
                      <p className="font-semibold">Applicants</p>
                      <p className="text-lg font-bold">{selectedJob.metrics.totalApplicants}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-800">
                      <p className="font-semibold">Recommended</p>
                      <p className="text-lg font-bold">{selectedJob.metrics.recommended}</p>
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-2 text-amber-800">
                      <p className="font-semibold">Interviews</p>
                      <p className="text-lg font-bold">{selectedJob.metrics.interviews}</p>
                    </div>
                    <div className="rounded-lg border border-purple-100 bg-purple-50 p-2 text-purple-800">
                      <p className="font-semibold">Improvements</p>
                      <p className="text-lg font-bold">{selectedJob.metrics.improvementCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Recommended candidate shortlist</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedJob.recommendedCandidates.map((candidate, index) => (
                    <CandidateCard key={candidate.id} candidate={candidate} rank={index + 1} />
                  ))}
                </div>
              </div>
              <aside className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Next recruiter actions</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {selectedJob.nextSteps.map(step => (
                    <li key={step} className="flex gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-blue-400" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </article>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Applicant database</h2>
        <p className="text-sm text-gray-600 max-w-3xl">
          Browse every applicant surfaced by the AI engine, sorted by recruiter-defined priority. Improvement tracking
          helps signal when someone climbs the ranking after assessments or added research.
        </p>
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Candidate</th>
                <th className="px-4 py-3 text-left font-semibold">Match</th>
                <th className="px-4 py-3 text-left font-semibold">Bias-free</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Must match</th>
                <th className="px-4 py-3 text-left font-semibold">Recent improvement</th>
                <th className="px-4 py-3 text-left font-semibold">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboardData.applicantDatabase.map(candidate => {
                const latestImprovement = candidate.improvementJourney[0];
                return (
                  <tr key={candidate.id} className="hover:bg-blue-50/50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{candidate.name}</div>
                      <div className="text-xs text-gray-600">{candidate.currentRole}</div>
                      <div className="text-xs text-gray-500">{candidate.location}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-800 font-semibold">{candidate.matchScore}</td>
                    <td className="px-4 py-4 text-gray-800 font-semibold">{candidate.biasFreeScore}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${priorityClasses[candidate.priority]}`}
                      >
                        {candidate.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">{candidate.mustMatchFlags.join(", ")}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">
                      {latestImprovement ? `${latestImprovement.label} · ${latestImprovement.status}` : "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">{candidate.lastActivity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
