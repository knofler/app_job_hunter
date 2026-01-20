"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import type { JobDescription } from "@/lib/recruiter-workflow";
import {
  generateRecruiterRanking,
  listJobDescriptions,
  listResumeOptions,
  parseJobDescriptionFile,
  uploadResumeFile,
  type RankedResumeScore,
  type ResumeOption,
} from "@/lib/recruiter-ranking";

type JobOption = {
  id: string;
  title: string;
  description: string;
  company?: string | null;
  isCustom?: boolean;
  sourceLabel?: string | null;
};

export default function RecruiterRankingPage() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [customJobOptions, setCustomJobOptions] = useState<JobOption[]>([]);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [rankedResults, setRankedResults] = useState<RankedResumeScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobDragActive, setJobDragActive] = useState(false);
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsResponse, resumeResponse] = await Promise.all([
          listJobDescriptions(),
          listResumeOptions(),
        ]);
        setJobDescriptions(jobsResponse.items ?? []);
        setResumes(resumeResponse.items ?? []);
      } catch (err) {
        setError((err as Error).message || "Failed to load data");
      }
    };
    loadData();
  }, []);

  const jobOptions = useMemo<JobOption[]>(
    () => [
      ...customJobOptions,
      ...jobDescriptions.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        company: job.company,
      })),
    ],
    [customJobOptions, jobDescriptions],
  );

  const selectedJob = useMemo(
    () => jobOptions.find(job => job.id === selectedJobId),
    [jobOptions, selectedJobId],
  );

  const jobDescriptionText = selectedJob?.description ?? "";
  const jobTitle = selectedJob?.title ?? "";

  const handleDragStart = (payload: { type: "job" | "resume"; id: string }) => (event: DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleJobFileDrop = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded: JobOption[] = [];
      for (const file of Array.from(files)) {
        const result = await parseJobDescriptionFile(file);
        const title = file.name.replace(/\.[^.]+$/, "");
        uploaded.push({
          id: `custom-${Date.now()}-${uploaded.length}`,
          title,
          description: result.text || "",
          company: "Uploaded JD",
          isCustom: true,
          sourceLabel: file.name,
        });
      }
      if (uploaded.length > 0) {
        setCustomJobOptions(current => [...uploaded, ...current]);
        setSelectedJobId(uploaded[0].id);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to parse job description file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResumeFileDrop = async (files: FileList) => {
    setIsUploading(true);
    try {
      const uploaded: ResumeOption[] = [];
      for (const file of Array.from(files)) {
        const candidateName = file.name.replace(/\.[^.]+$/, "");
        const result = await uploadResumeFile(file, candidateName);
        uploaded.push({
          id: result.resume_id,
          name: candidateName,
          candidate_name: candidateName,
        });
      }
      if (uploaded.length > 0) {
        setResumes(current => [...uploaded, ...current]);
        setSelectedResumeIds(current => [
          ...current,
          ...uploaded.map(item => item.id).filter(id => !current.includes(id)),
        ]);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to upload resume file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleJobDrop = async (event: DragEvent) => {
    event.preventDefault();
    setJobDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      await handleJobFileDrop(event.dataTransfer.files);
      return;
    }
    const data = event.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const parsed = JSON.parse(data) as { type?: string; id?: string };
      if (parsed.type === "job" && parsed.id) {
        setSelectedJobId(parsed.id);
      }
    } catch {
      return;
    }
  };

  const handleResumeDrop = async (event: DragEvent) => {
    event.preventDefault();
    setResumeDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      await handleResumeFileDrop(event.dataTransfer.files);
      return;
    }
    const data = event.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const parsed = JSON.parse(data) as { type?: string; id?: string };
      if (parsed.type === "resume" && parsed.id) {
        const resumeId = parsed.id;
        setSelectedResumeIds(current => (current.includes(resumeId) ? current : [...current, resumeId]));
      }
    } catch {
      return;
    }
  };

  const handleRunRanking = async () => {
    if (!selectedJob) {
      setError("Select a job description first");
      return;
    }
    if (!jobDescriptionText.trim()) {
      setError("Job description is required");
      return;
    }
    if (selectedResumeIds.length === 0) {
      setError("Select at least one resume");
      return;
    }
    setError(null);
    setIsLoading(true);
    setRankedResults([]);
    try {
      const selectedResumes = selectedResumeIds.map(id => {
        const resume = resumes.find(item => item.id === id);
        return {
          resume_id: id,
          candidate_id: resume?.candidate_id ?? null,
        };
      });
      const response = await generateRecruiterRanking({
        job_description: jobDescriptionText,
        job_id: selectedJob?.isCustom ? null : selectedJob?.id ?? null,
        job_title: jobTitle,
        resumes: selectedResumes,
      });
      setRankedResults(response.ranked_shortlist ?? []);
    } catch (err) {
      setError((err as Error).message || "Failed to generate ranking");
    } finally {
      setIsLoading(false);
    }
  };

  const clampPercent = (value?: number | null) => {
    const numeric = Number.isFinite(value) ? (value as number) : 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
  };

  const formatPercent = (value?: number | null) => `${clampPercent(value)}%`;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Recruiter Ranking (MVP)</h1>
          <p className="mt-2 text-sm text-slate-600">
            Select one job description and multiple resumes to generate a ranked shortlist with scores.
          </p>
        </header>

        {error ? (
          <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">Job Descriptions</h2>
            <p className="mt-1 text-xs text-slate-500">Pick one job description.</p>
            <div
              className={`mt-3 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition ${
                jobDragActive
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-slate-300 bg-gradient-to-br from-slate-50 to-white text-slate-500"
              }`}
              onDragOver={event => {
                event.preventDefault();
                setJobDragActive(true);
              }}
              onDragLeave={() => setJobDragActive(false)}
              onDrop={handleJobDrop}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm">📄</span>
                <div>
                  <div className="font-semibold">Drop job descriptions here</div>
                  <div className="text-xs text-slate-500">You can drop multiple files or choose from the dropdown.</div>
                </div>
              </div>
            </div>
            <select
              className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedJobId}
              onChange={event => setSelectedJobId(event.target.value)}
            >
              <option value="">Select a job</option>
              {customJobOptions.map(job => (
                <option key={job.id} value={job.id}>
                  Uploaded JD — {job.title}
                </option>
              ))}
              {jobDescriptions.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.company}
                </option>
              ))}
            </select>
            {selectedJob ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="font-medium text-slate-700">{jobTitle || "Job description"}</div>
                {selectedJob.sourceLabel ? (
                  <div className="mt-1 text-[11px] text-slate-500">Source: {selectedJob.sourceLabel}</div>
                ) : null}
                <p className="mt-1 line-clamp-6 whitespace-pre-wrap">{jobDescriptionText}</p>
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
              {customJobOptions.map(job => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={handleDragStart({ type: "job", id: job.id })}
                  className={`cursor-move rounded-md border px-3 py-2 text-xs ${
                    selectedJobId === job.id
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <div className="font-medium text-slate-700">{job.title}</div>
                  <div className="text-slate-500">Uploaded JD</div>
                </div>
              ))}
              {jobDescriptions.map(job => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={handleDragStart({ type: "job", id: job.id })}
                  className={`cursor-move rounded-md border px-3 py-2 text-xs ${
                    selectedJobId === job.id
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <div className="font-medium text-slate-700">{job.title}</div>
                  <div className="text-slate-500">{job.company}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">Resumes</h2>
            <p className="mt-1 text-xs text-slate-500">Select multiple resumes.</p>
            <div
              className={`mt-3 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition ${
                resumeDragActive
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-slate-300 bg-gradient-to-br from-slate-50 to-white text-slate-500"
              }`}
              onDragOver={event => {
                event.preventDefault();
                setResumeDragActive(true);
              }}
              onDragLeave={() => setResumeDragActive(false)}
              onDrop={handleResumeDrop}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm">🧑‍💼</span>
                <div>
                  <div className="font-semibold">Drop resumes here</div>
                  <div className="text-xs text-slate-500">You can drop multiple resumes.</div>
                </div>
              </div>
            </div>
            <select
              className="mt-3 h-64 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              multiple
              value={selectedResumeIds}
              onChange={event =>
                setSelectedResumeIds(
                  Array.from(event.target.selectedOptions).map(option => option.value),
                )
              }
            >
              {resumes.map(resume => (
                <option key={resume.id} value={resume.id}>
                  {resume.candidate_name ? `${resume.candidate_name} — ` : ""}
                  {resume.name}
                </option>
              ))}
            </select>
            <div className="mt-4 space-y-2">
              {resumes.map(resume => (
                <div
                  key={resume.id}
                  draggable
                  onDragStart={handleDragStart({ type: "resume", id: resume.id })}
                  className={`cursor-move rounded-md border px-3 py-2 text-xs ${
                    selectedResumeIds.includes(resume.id)
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <div className="font-medium text-slate-700">
                    {resume.candidate_name ? `${resume.candidate_name} — ` : ""}
                    {resume.name}
                  </div>
                  {resume.summary ? (
                    <div className="mt-1 text-slate-500 line-clamp-2">{resume.summary}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleRunRanking}
            disabled={isLoading}
          >
            {isLoading ? "Ranking..." : "Run Ranking"}
          </button>
          {isUploading ? (
            <span className="text-xs text-slate-500">Uploading files...</span>
          ) : null}
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Scoring Results</h2>
            {selectedJob ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Against: {selectedJob.title}
              </span>
            ) : null}
          </div>
          {rankedResults.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              No results yet. Run ranking to see scores.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {rankedResults.map(result => {
                const resume = resumes.find(item => item.id === result.resume_id);
                const scorePercent = clampPercent(result.score);
                const confidencePercent = clampPercent(result.confidence ?? result.score);
                const breakdown = result.breakdown ?? [];
                const positiveSignals = result.positive_signals ?? [];
                const negativeSignals = result.negative_signals ?? [];
                const missingKeywords = result.missing_keywords ?? result.skills_analysis?.missing ?? [];
                const matchedKeywords = result.matched_keywords ?? result.skills_analysis?.found ?? [];
                const improvements = result.improvement_suggestions ?? [];

                return (
                  <article
                    key={`${result.candidate_id}-${result.resume_id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">Scoring Result</div>
                        <div className="mt-1 text-xs font-semibold text-emerald-700">
                          Category: {result.status || "Comprehensive Resume Analysis"}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {resume?.candidate_name ? `${resume.candidate_name} — ` : ""}
                          {resume?.name ?? result.resume_id}
                        </div>
                        <div className="text-sm text-slate-500">
                          {result.summary || result.notes || "No summary provided yet."}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                          {scorePercent}% Match
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Rank #{result.rank}
                        </span>
                        {result.priority ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            {result.priority}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                            <div className="text-xs font-semibold text-emerald-700">Positive Signals</div>
                            {positiveSignals.length > 0 ? (
                              <ul className="mt-2 space-y-1 text-xs text-emerald-800">
                                {positiveSignals.map(signal => (
                                  <li key={signal}>+ {signal}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-xs text-emerald-700">No positive signals identified.</p>
                            )}
                          </div>
                          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                            <div className="text-xs font-semibold text-rose-700">Negative Signals</div>
                            {negativeSignals.length > 0 ? (
                              <ul className="mt-2 space-y-1 text-xs text-rose-800">
                                {negativeSignals.map(signal => (
                                  <li key={signal}>- {signal}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-xs text-rose-700">No risks flagged.</p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-600">Missing Keywords</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {missingKeywords.length > 0 ? (
                                missingKeywords.map(keyword => (
                                  <span
                                    key={keyword}
                                    className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-medium text-rose-700"
                                  >
                                    {keyword}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">None</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-600">Matched Keywords</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {matchedKeywords.length > 0 ? (
                                matchedKeywords.map(keyword => (
                                  <span
                                    key={keyword}
                                    className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700"
                                  >
                                    {keyword}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">None</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {improvements.length > 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold text-slate-700">Improvement Suggestions</div>
                            <ul className="mt-2 space-y-1 text-xs text-slate-600">
                              {improvements.map(item => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {result.skills_analysis ? (
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-semibold text-slate-700">Skills Analysis</div>
                            <div className="mt-2 grid gap-3 md:grid-cols-2">
                              <div>
                                <div className="text-[11px] font-medium text-emerald-700">Found</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(result.skills_analysis.found ?? []).length > 0 ? (
                                    (result.skills_analysis.found ?? []).map(skill => (
                                      <span
                                        key={skill}
                                        className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400">None</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] font-medium text-rose-700">Missing</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(result.skills_analysis.missing ?? []).length > 0 ? (
                                    (result.skills_analysis.missing ?? []).map(skill => (
                                      <span
                                        key={skill}
                                        className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-medium text-rose-700"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400">None</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Confidence</span>
                          <span>{formatPercent(confidencePercent)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${confidencePercent}%` }}
                          />
                        </div>
                        <div className="mt-4 space-y-2">
                          {breakdown.length > 0 ? (
                            breakdown.map(item => (
                              <div key={item.label} className="flex items-center justify-between text-xs text-slate-600">
                                <span>{item.label}</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                  {formatPercent(item.score)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400">No breakdown available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
