"use client";

import { ChangeEvent, useMemo, useState } from "react";

import {
  fallbackRecruiterWorkflow,
  RecruiterWorkflowCandidate,
  RecruiterWorkflowImprovement,
} from "@/lib/fallback-data";

const data = fallbackRecruiterWorkflow;

const skillStatusClasses: Record<string, string> = {
  Yes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Partial: "bg-amber-100 text-amber-700 border-amber-200",
  No: "bg-rose-100 text-rose-700 border-rose-200",
};

const improvementStatusClasses: Record<RecruiterWorkflowImprovement["status"], string> = {
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "In progress": "border-amber-200 bg-amber-50 text-amber-700",
  Queued: "border-slate-200 bg-slate-50 text-slate-700",
};

const priorityBadgeClasses: Record<RecruiterWorkflowCandidate["priority"], string> = {
  Hot: "bg-rose-100 text-rose-700 border-rose-200",
  Warm: "bg-amber-100 text-amber-700 border-amber-200",
  Pipeline: "bg-slate-100 text-slate-700 border-slate-200",
};

const defaultUploadedFiles = data.candidates.map((candidate, index) => {
  const safeName = candidate.name.replace(/\s+/g, "_");
  return `${index + 1}_${safeName}.pdf`;
});

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function ImprovementTimeline({ items }: { items: RecruiterWorkflowImprovement[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="space-y-3 text-sm text-gray-700">
      {items.map(item => (
        <li key={`${item.label}-${item.status}`} className={`rounded-xl border px-4 py-3 ${improvementStatusClasses[item.status]}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">{item.status}</div>
          <p className="mt-2 font-medium text-gray-800">{item.label}</p>
          <p className="text-xs text-gray-500">
            {item.completedAt ? `Completed ${item.completedAt}` : "Pending"}
            {item.impact ? ` · ${item.impact}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function RecruiterAIWorkflowPage() {
  const [jobDescription, setJobDescription] = useState<string>(data.jobDescription);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(defaultUploadedFiles);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(data.candidates[0]?.id ?? "");
  const [analysisState, setAnalysisState] = useState<"ready" | "running">("ready");
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date>(new Date());

  const selectedCandidate = useMemo<RecruiterWorkflowCandidate | undefined>(
    () => data.candidates.find(candidate => candidate.id === selectedCandidateId),
    [selectedCandidateId],
  );

  const topCandidates = useMemo(() => data.candidates.slice(0, 3), []);

  const handleGenerate = (): void => {
    if (analysisState === "running") {
      return;
    }
    setAnalysisState("running");
    window.setTimeout(() => {
      setAnalysisState("ready");
      setLastAnalyzedAt(new Date());
    }, 900);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? []).slice(0, 5);
    if (files.length === 0) {
      return;
    }
    setUploadedFiles(files.map(file => file.name));
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
          Recruiter AI Workflow · Prototype
        </span>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Recruiter AI workflow mock</h1>
            <p className="text-gray-600">
              This view mirrors the PartyRock recruiter assistant but re-centres on the functional requirements: job
              profiles keep a document trail, AI ranks best-fit resumes, and recruiters monitor how applicants improve
              their standing via assessments or research.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-blue-500" />
                Maintain a living job brief with AI-derived must-have skills and recruiter filters.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-blue-500" />
                Surface the ranked shortlist with match/bias-free scores, recruiter-defined priority, and must-match flags.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-blue-500" />
                Track ranking improvements as candidates complete voluntary assessments or add context.
              </li>
            </ul>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
              <p className="text-sm uppercase tracking-wide text-blue-600">Target brief</p>
              <p className="mt-1 text-lg font-semibold text-blue-900">{data.jobTitle}</p>
              <p className="text-sm text-blue-700">{data.jobLevel}</p>
              <p className="mt-2 text-sm text-blue-800">{data.jobSummary}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm text-gray-500">
            <div>
              <span className="font-semibold text-gray-700">Job code:</span> {data.jobCode}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Salary band:</span> {data.salaryBand}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Last analysis:</span> {formatDateTime(lastAnalyzedAt)}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={analysisState === "running"}
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analysisState === "running" ? "Generating sample..." : "Re-run sample analysis"}
            </button>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">1. Inputs captured</h2>
          {analysisState === "running" && (
            <span className="text-sm text-blue-600">Simulating processing •••</span>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job description</h3>
                <p className="text-sm text-gray-500">Recruiter-owned text that feeds the AI prompt.</p>
              </div>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Required
              </span>
            </div>
            <textarea
              value={jobDescription}
              onChange={event => setJobDescription(event.target.value)}
              rows={16}
              className="mt-4 h-full w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Candidate resumes</h3>
                <p className="text-sm text-gray-500">Upload up to five resumes. AI will attach the files to the prompt.</p>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {uploadedFiles.length} uploaded
              </span>
            </div>
            <label className="block rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 hover:border-blue-200 hover:text-blue-700">
              <span className="font-medium">Drag & drop or browse</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="mt-1 text-xs text-gray-500">Accepted: PDF, DOCX, TXT · Max 5 files</p>
            </label>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Uploaded files</p>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                {uploadedFiles.map(file => (
                  <li key={file} className="truncate">{file}</li>
                ))}
              </ul>
            </div>
            <div className="grid flex-1 gap-3">
              {data.candidates.map(candidate => {
                const isActive = candidate.id === selectedCandidateId;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-blue-500 bg-blue-50 shadow"
                        : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
                        <p className="text-xs text-gray-600">{candidate.currentRole}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>
                          Match: <span className="font-semibold text-gray-700">{candidate.matchScore}</span>
                        </p>
                        <p>
                          Bias-free: <span className="font-semibold text-gray-700">{candidate.biasFreeScore}</span>
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-gray-600">{candidate.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">2. Workflow steps</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.workflowSteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600">{step.description}</p>
              {step.bullets && step.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-500">
                  {step.bullets.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">3. Core must-have skills</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {data.coreSkills.map(skill => (
            <div key={skill.name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{skill.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">4. AI-powered analysis (markdown preview)</h2>
          <span className="text-xs uppercase tracking-wide text-gray-500">Synced with PartyRock prompt structure</span>
        </div>
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900">Top Candidates for the Role</h3>
          <div>
            <p className="text-sm font-semibold text-gray-800">Core must-have skills for this job:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-gray-600">
              {data.coreSkills.map(skill => (
                <li key={skill.name}>{skill.name}</li>
              ))}
            </ul>
          </div>
          {topCandidates.map((candidate, index) => (
            <div key={candidate.id} className="space-y-3 border-t border-gray-100 pt-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Rank {index + 1}: Candidate {candidate.name}
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><span className="font-semibold text-gray-800">Match Score:</span> {candidate.matchScore}/100</li>
                <li><span className="font-semibold text-gray-800">Bias-Free Score:</span> {candidate.biasFreeScore}/100</li>
                <li>
                  <span className="font-semibold text-gray-800">AI Summary:</span> {candidate.summary}
                </li>
              </ul>
              <div>
                <p className="text-sm font-semibold text-gray-800">Skill alignment:</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {candidate.skillAlignment.map(skill => (
                    <li key={skill.skill}>
                      <span className="font-semibold">{skill.skill}</span>: {skill.status} – {skill.evidence}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">5. Ranked shortlist</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Candidate</th>
                <th className="px-4 py-3 text-left font-semibold">Match</th>
                <th className="px-4 py-3 text-left font-semibold">Bias-free</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.candidates.map(candidate => {
                const isActive = candidate.id === selectedCandidateId;
                return (
                  <tr
                    key={candidate.id}
                    className={`${isActive ? "bg-blue-50/60" : "bg-white"} hover:bg-blue-50/50`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{candidate.name}</div>
                      <div className="text-xs text-gray-600">{candidate.currentRole}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{candidate.matchScore}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{candidate.biasFreeScore}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          priorityBadgeClasses[candidate.priority]
                        }`}
                      >
                        {candidate.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">{candidate.status}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{candidate.availability}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCandidate && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">6. Detailed readout</h2>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Focus: {selectedCandidate.name}
            </span>
          </div>
          <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">{selectedCandidate.name}</h3>
                <p className="text-sm text-gray-600">{selectedCandidate.currentRole}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCandidate.mustMatchFlags.map(flag => (
                    <span
                      key={flag}
                      className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                    >
                      Must match: {flag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold text-gray-800">Match</span>
                  <div className="text-lg font-bold text-blue-700">{selectedCandidate.matchScore}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Bias-free</span>
                  <div className="text-lg font-bold text-emerald-700">{selectedCandidate.biasFreeScore}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Experience</span>
                  <div>{selectedCandidate.experienceYears}+ yrs</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Compensation</span>
                  <div>{selectedCandidate.compensation}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Priority</span>
                  <div
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      priorityBadgeClasses[selectedCandidate.priority]
                    }`}
                  >
                    {selectedCandidate.priority}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700">{selectedCandidate.summary}</p>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Highlights</h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {selectedCandidate.highlights.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 grow-0 rounded-full bg-blue-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {selectedCandidate.skillAlignment.map(alignment => (
                <div key={alignment.skill} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{alignment.skill}</p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        skillStatusClasses[alignment.status]
                      }`}
                    >
                      {alignment.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{alignment.evidence}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Recruiter notes</h4>
              <p className="mt-2">{selectedCandidate.recruiterNotes}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Recommendation</h4>
                <p className="mt-2 text-sm text-emerald-900">{selectedCandidate.recommendation}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-700">Risks & notes</h4>
                <ul className="mt-2 space-y-2 text-sm text-amber-900">
                  {selectedCandidate.riskNotes.map(note => (
                    <li key={note} className="flex gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 grow-0 rounded-full bg-amber-500" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Commitment & ranking improvements
              </h4>
              <ImprovementTimeline items={selectedCandidate.improvementJourney} />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">7. Engagement plan</h3>
            <p className="text-sm text-gray-600">Financial comparison and recruiter levers carried over from the PartyRock output.</p>
            <ul className="space-y-3 text-sm text-gray-700">
              {data.engagementInsights.map(item => (
                <li key={item.label} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-900">{item.label}</p>
                  <p className="mt-1 text-sm text-blue-800">{item.value}</p>
                  {item.helper && <p className="mt-1 text-xs text-blue-700">{item.helper}</p>}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">8. Fairness & panel guidance</h3>
            <p className="text-sm text-gray-600">Bias-aware scoring stays visible so recruiters can act on mitigation steps.</p>
            <ul className="space-y-3 text-sm text-gray-700">
              {data.fairnessInsights.map(item => (
                <li key={item.label} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">{item.label}</p>
                  <p className="mt-1 text-sm text-emerald-800">{item.value}</p>
                  {item.helper && <p className="mt-1 text-xs text-emerald-700">{item.helper}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">9. Interview preparation pack</h2>
        <p className="text-sm text-gray-600 max-w-3xl">
          The question bank—including rationale—travels with the recruiter so panel prep remains transparent even once we
          swap the static data for real LLM output.
        </p>
        <ol className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-700">
          {data.interviewPreparation.map((item, index) => (
            <li key={item.question} className="space-y-1">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{item.question}</p>
                  <p className="text-xs text-gray-500">Why: {item.rationale}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
        <h2 className="text-base font-semibold text-gray-800">10. Prototype disclaimers</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {data.disclaimers.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

