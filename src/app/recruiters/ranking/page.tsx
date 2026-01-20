"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import type { JobDescription } from "@/lib/recruiter-workflow";
import {
  generateRecruiterRanking,
  listJobDescriptions,
  listResumeOptions,
  uploadJobDescriptionFile,
  uploadResumeFile,
  type RankedResumeScore,
  type ResumeOption,
} from "@/lib/recruiter-ranking";

export default function RecruiterRankingPage() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [resumeSearch, setResumeSearch] = useState("");
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

  const selectedJob = useMemo(
    () => jobDescriptions.find(job => job.id === selectedJobId),
    [jobDescriptions, selectedJobId],
  );

  const jobDescriptionText = selectedJob?.description ?? "";
  const jobTitle = selectedJob?.title ?? "";

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
  };

  const sortedJobs = useMemo(() => {
    return [...jobDescriptions].sort((a, b) => {
      const left = new Date(a.uploaded_at || a.updated_at || a.created_at).getTime();
      const right = new Date(b.uploaded_at || b.updated_at || b.created_at).getTime();
      return right - left;
    });
  }, [jobDescriptions]);

  const sortedResumes = useMemo(() => {
    return [...resumes].sort((a, b) => {
      const left = new Date(a.uploaded_at || a.last_updated || "").getTime();
      const right = new Date(b.uploaded_at || b.last_updated || "").getTime();
      return right - left;
    });
  }, [resumes]);

  const filteredJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    if (!query) return sortedJobs;
    return sortedJobs.filter(job =>
      [job.title, job.company, job.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [jobSearch, sortedJobs]);

  const filteredResumes = useMemo(() => {
    const query = resumeSearch.trim().toLowerCase();
    if (!query) return sortedResumes;
    return sortedResumes.filter(resume =>
      [resume.candidate_name, resume.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [resumeSearch, sortedResumes]);

  const toggleResumeSelection = (resumeId: string) => {
    setSelectedResumeIds(current =>
      current.includes(resumeId)
        ? current.filter(id => id !== resumeId)
        : [...current, resumeId]
    );
  };

  const handleDragStart = (payload: { type: "job" | "resume"; id: string }) => (event: DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleJobFileDrop = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      let lastUploadedId: string | null = null;
      for (const file of Array.from(files)) {
        const title = file.name.replace(/\.[^.]+$/, "");
        const result = await uploadJobDescriptionFile(file, title);
        lastUploadedId = result.job_id;
      }
      if (lastUploadedId) {
        const jobsResponse = await listJobDescriptions();
        setJobDescriptions(jobsResponse.items ?? []);
        setSelectedJobId(lastUploadedId);
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
      const uploadedIds: string[] = [];
      for (const file of Array.from(files)) {
        const candidateName = file.name.replace(/\.[^.]+$/, "");
        const result = await uploadResumeFile(file, candidateName);
        uploadedIds.push(result.resume_id);
      }
      if (uploadedIds.length > 0) {
        const resumeResponse = await listResumeOptions();
        setResumes(resumeResponse.items ?? []);
        setSelectedResumeIds(current => [
          ...current,
          ...uploadedIds.filter(id => !current.includes(id)),
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
        job_id: selectedJob?.id ?? null,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Recruiter Ranking</h1>
              <p className="mt-2 text-sm text-slate-600">
                Compare curated job descriptions with multiple resumes and generate a ranked shortlist.
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              AI Ranking Workspace
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Job Description</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">Single select</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Upload a JD or pick one from your saved list.</p>
            <div
              className={`mt-4 rounded-2xl border-2 border-dashed px-5 py-6 text-sm transition ${
                jobDragActive
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-slate-200 bg-gradient-to-br from-white to-slate-50 text-slate-500"
              }`}
              onDragOver={event => {
                event.preventDefault();
                setJobDragActive(true);
              }}
              onDragLeave={() => setJobDragActive(false)}
              onDrop={handleJobDrop}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">📄</span>
                <div>
                  <div className="text-sm font-semibold">Drop job descriptions here</div>
                  <div className="text-xs text-slate-500">Multiple files supported. We’ll store and de-dup automatically.</div>
                </div>
              </div>
            </div>
            <input
              type="text"
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Search job descriptions..."
              value={jobSearch}
              onChange={event => setJobSearch(event.target.value)}
            />
            <div className="relative mt-3">
              <select
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                value={selectedJobId}
                onChange={event => setSelectedJobId(event.target.value)}
              >
                <option value="">Select a job</option>
                {filteredJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.company} · {formatDate(job.uploaded_at || job.updated_at || job.created_at)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Showing newest uploads first. Use search to narrow the list.
            </div>
            {selectedJob ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected JD</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{jobTitle || "Job description"}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Uploaded {formatDate(selectedJob.uploaded_at || selectedJob.updated_at || selectedJob.created_at)}
                </div>
                <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-xs text-slate-600">{jobDescriptionText}</p>
              </div>
            ) : null}
            <div className="mt-4 text-xs text-slate-500">
              Tip: Use search to filter by title, company, or location.
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Resumes</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">Multi select</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Search and select multiple resumes to rank.</p>
            <div
              className={`mt-4 rounded-2xl border-2 border-dashed px-5 py-6 text-sm transition ${
                resumeDragActive
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-slate-200 bg-gradient-to-br from-white to-slate-50 text-slate-500"
              }`}
              onDragOver={event => {
                event.preventDefault();
                setResumeDragActive(true);
              }}
              onDragLeave={() => setResumeDragActive(false)}
              onDrop={handleResumeDrop}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">🧑‍💼</span>
                <div>
                  <div className="text-sm font-semibold">Drop resumes here</div>
                  <div className="text-xs text-slate-500">Multiple files supported. Duplicates are auto-upserted.</div>
                </div>
              </div>
            </div>
            <input
              type="text"
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Search resumes..."
              value={resumeSearch}
              onChange={event => setResumeSearch(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{filteredResumes.length} resumes</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                {selectedResumeIds.length} selected
              </span>
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {filteredResumes.map(resume => {
                const isSelected = selectedResumeIds.includes(resume.id);
                return (
                  <button
                    key={resume.id}
                    type="button"
                    onClick={() => toggleResumeSelection(resume.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-slate-200 bg-white hover:border-emerald-100 hover:bg-emerald-50/20"
                    }`}
                  >
                    <span
                      className={`mt-1 flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800">
                        {resume.candidate_name ? `${resume.candidate_name} — ` : ""}
                        {resume.name}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Uploaded {formatDate(resume.uploaded_at || resume.last_updated)}
                      </div>
                      {resume.summary ? (
                        <div className="mt-1 text-xs text-slate-500 line-clamp-2">{resume.summary}</div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
              {filteredResumes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                  No resumes match this search.
                </div>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
              Click a resume to add/remove it from the selection.
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
