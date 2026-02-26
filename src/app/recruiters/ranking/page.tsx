"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Listbox } from "@headlessui/react";
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
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>

      {/* ─── LEFT PANEL: Inputs ─────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Step 1: Job Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Job Description</h2>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Single select</span>
            </div>

            {/* Drag-drop zone for JD */}
            <div
              className={`rounded-xl border-2 border-dashed px-4 py-4 text-sm transition cursor-pointer ${
                jobDragActive ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
              }`}
              onDragOver={e => { e.preventDefault(); setJobDragActive(true); }}
              onDragLeave={() => setJobDragActive(false)}
              onDrop={handleJobDrop}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-card shadow-sm text-base">📄</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Drop a JD file here</p>
                  <p className="text-xs text-muted-foreground">PDF or DOCX supported</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 pl-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search job descriptions..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} />
              <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <Listbox value={selectedJobId} onChange={setSelectedJobId}>
              <div className="relative">
                <Listbox.Button className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left text-sm font-medium text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <span className="truncate">
                    {selectedJob ? `${selectedJob.title} — ${selectedJob.company}` : "Select a job description"}
                  </span>
                  <svg className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                  </svg>
                </Listbox.Button>
                <Listbox.Options className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card p-1.5 text-sm shadow-xl">
                  {filteredJobs.length === 0
                    ? <div className="px-3 py-2 text-xs text-muted-foreground">No job descriptions found.</div>
                    : filteredJobs.map(job => (
                      <Listbox.Option key={job.id} value={job.id}
                        className={({ active }) => `cursor-pointer rounded-lg px-3 py-2 transition ${active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}>
                        <div className="text-sm font-semibold truncate">{job.title}</div>
                        <div className="text-xs text-muted-foreground">{job.company} · {formatDate(job.uploaded_at || job.updated_at || job.created_at)}</div>
                      </Listbox.Option>
                    ))
                  }
                </Listbox.Options>
              </div>
            </Listbox>

            {selectedJob && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Selected</p>
                <p className="text-sm font-semibold text-foreground">{jobTitle || selectedJob.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{jobDescriptionText ? jobDescriptionText.substring(0, 120) + "..." : "No description"}</p>
              </div>
            )}
          </div>

          {/* Step 2: Resumes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Resumes</h2>
              {selectedResumeIds.length > 0 && (
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{selectedResumeIds.length} selected</span>
              )}
            </div>

            {/* Drag-drop zone for resumes */}
            <div
              className={`rounded-xl border-2 border-dashed px-4 py-4 text-sm transition cursor-pointer ${
                resumeDragActive ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
              }`}
              onDragOver={e => { e.preventDefault(); setResumeDragActive(true); }}
              onDragLeave={() => setResumeDragActive(false)}
              onDrop={handleResumeDrop}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-card shadow-sm text-base">📋</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Drop resumes here</p>
                  <p className="text-xs text-muted-foreground">Multiple files supported</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 pl-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search resumes..." value={resumeSearch} onChange={e => setResumeSearch(e.target.value)} />
              <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {selectedResumeIds.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{selectedResumeIds.length} resume{selectedResumeIds.length > 1 ? "s" : ""} selected</span>
                <button type="button" onClick={() => setSelectedResumeIds([])} className="text-xs text-rose-600 hover:text-rose-800">Clear all</button>
              </div>
            )}

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filteredResumes.map(resume => {
                const isSelected = selectedResumeIds.includes(resume.id);
                return (
                  <label key={resume.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${isSelected ? "border-primary bg-primary/5" : "border-border bg-muted hover:border-primary/30"}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleResumeSelection(resume.id)} className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{resume.name}</p>
                      {resume.candidate_name && <p className="text-xs text-muted-foreground">{resume.candidate_name}</p>}
                    </div>
                  </label>
                );
              })}
              {filteredResumes.length === 0 && <p className="text-xs text-muted-foreground py-2">No resumes found.</p>}
            </div>
          </div>
        </div>

        {/* Run button — sticky at bottom */}
        <div className="flex-shrink-0 border-t border-border bg-card p-4 space-y-2">
          {error && <p className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">{error}</p>}
          {isUploading && <p className="text-xs text-muted-foreground">Uploading files...</p>}
          <button type="button" onClick={handleRunRanking} disabled={isLoading || !selectedJobId || selectedResumeIds.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Ranking resumes...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Run Ranking
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ─── RIGHT PANEL: Results ────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-muted/30">
        <div className="p-6 space-y-4">

          {/* Empty state */}
          {rankedResults.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Ready to rank</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Select a job description and resumes on the left, then click <strong>Run Ranking</strong>.</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">AI is analysing candidates…</p>
                <p className="mt-1 text-xs text-muted-foreground">Ranking resumes against the job description</p>
              </div>
              <div className="flex flex-col gap-2 w-60">
                {[
                  { label: "Loading resume contexts",  delay: "0ms"   },
                  { label: "Extracting core skills",   delay: "600ms" },
                  { label: "Running AI analysis",      delay: "1200ms"},
                  { label: "Building ranked shortlist",delay: "1800ms"},
                ].map(({ label, delay }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse" style={{ animationDelay: delay }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results header */}
          {rankedResults.length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Ranking Results</h2>
                {selectedJob && <p className="text-xs text-muted-foreground">Against: {selectedJob.title}</p>}
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{rankedResults.length} candidate{rankedResults.length > 1 ? "s" : ""} ranked</span>
            </div>
          )}

          {/* Results cards */}
          {rankedResults.map((result, index) => {
            const resume = resumes.find(item => item.id === result.resume_id);
            const scorePercent = clampPercent(result.score);
            const confidencePercent = clampPercent(result.confidence ?? result.score);
            const breakdown = result.breakdown ?? [];
            const positiveSignals = result.positive_signals ?? [];
            const negativeSignals = result.negative_signals ?? [];
            const missingKeywords = result.missing_keywords ?? result.skills_analysis?.missing ?? [];
            const matchedKeywords = result.matched_keywords ?? result.skills_analysis?.found ?? [];
            const improvements = result.improvement_suggestions ?? [];

            const scoreColor = scorePercent >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : scorePercent >= 60 ? "bg-blue-100 text-blue-700 border-blue-200"
              : scorePercent >= 40 ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-rose-100 text-rose-700 border-rose-200";

            return (
              <article key={`${result.candidate_id}-${result.resume_id}`}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-start justify-between gap-4 p-5 border-b border-border/50">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-bold ${scoreColor}`}>
                      {scorePercent}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {resume?.candidate_name ? `${resume.candidate_name} — ` : ""}{resume?.name ?? result.resume_id}
                      </p>
                      <p className="text-xs text-muted-foreground">{result.summary || result.notes || "No summary"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">#{result.rank ?? index + 1}</span>
                    {result.priority && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{result.priority}</span>}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-4">
                    {/* Signals */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                        <p className="text-xs font-semibold text-emerald-700 mb-2">Positive Signals</p>
                        {positiveSignals.length > 0
                          ? <ul className="space-y-0.5 text-xs text-emerald-800">{positiveSignals.map(s => <li key={s}>+ {s}</li>)}</ul>
                          : <p className="text-xs text-emerald-600">None identified.</p>}
                      </div>
                      <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                        <p className="text-xs font-semibold text-rose-700 mb-2">Negative Signals</p>
                        {negativeSignals.length > 0
                          ? <ul className="space-y-0.5 text-xs text-rose-800">{negativeSignals.map(s => <li key={s}>- {s}</li>)}</ul>
                          : <p className="text-xs text-rose-600">None flagged.</p>}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Matched Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedKeywords.length > 0
                            ? matchedKeywords.map(k => <span key={k} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{k}</span>)
                            : <span className="text-xs text-muted-foreground">None</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Missing Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {missingKeywords.length > 0
                            ? missingKeywords.map(k => <span key={k} className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">{k}</span>)
                            : <span className="text-xs text-muted-foreground">None</span>}
                        </div>
                      </div>
                    </div>

                    {/* Skills analysis */}
                    {result.skills_analysis && (
                      <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Skills Analysis</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-medium text-emerald-700 mb-1">Found</p>
                            <div className="flex flex-wrap gap-1">
                              {(result.skills_analysis.found ?? []).map(s => <span key={s} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">{s}</span>)}
                              {(result.skills_analysis.found ?? []).length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-rose-700 mb-1">Missing</p>
                            <div className="flex flex-wrap gap-1">
                              {(result.skills_analysis.missing ?? []).map(s => <span key={s} className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">{s}</span>)}
                              {(result.skills_analysis.missing ?? []).length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Improvements */}
                    {improvements.length > 0 && (
                      <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-2">Improvement Suggestions</p>
                        <ul className="space-y-0.5 text-xs text-amber-800">
                          {improvements.map(item => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Confidence panel */}
                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Confidence</span>
                      <span className="font-semibold">{formatPercent(confidencePercent)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className={`h-2 rounded-full transition-all ${confidencePercent >= 70 ? "bg-emerald-500" : confidencePercent >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                        style={{ width: `${confidencePercent}%` }} />
                    </div>
                    {breakdown.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {breakdown.map(item => (
                          <div key={item.label} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground">{formatPercent(item.score)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {breakdown.length === 0 && <p className="mt-3 text-xs text-muted-foreground">No breakdown.</p>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
