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

export default function RecruiterRankingPage() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [customJobDescription, setCustomJobDescription] = useState("");
  const [customJobTitle, setCustomJobTitle] = useState("");
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

  const selectedJob = useMemo(
    () => jobDescriptions.find(job => job.id === selectedJobId),
    [jobDescriptions, selectedJobId],
  );

  const jobDescriptionText = selectedJob?.description || (selectedJobId === "custom" ? customJobDescription : "");
  const jobTitle = selectedJob?.title || (selectedJobId === "custom" ? customJobTitle : "");

  const handleDragStart = (payload: { type: "job" | "resume"; id: string }) => (event: DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleJobFileDrop = async (files: FileList) => {
    const file = files.item(0);
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await parseJobDescriptionFile(file);
      setCustomJobDescription(result.text || "");
      setCustomJobTitle(file.name.replace(/\.[^.]+$/, ""));
      setSelectedJobId("custom");
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
    if (!selectedJob && selectedJobId !== "custom") {
      setError("Select a job description first");
      return;
    }
    if (selectedJobId === "custom" && !customJobDescription.trim()) {
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
                  <div className="font-semibold">Drop a job description here</div>
                  <div className="text-xs text-slate-500">Or choose from the dropdown below.</div>
                </div>
              </div>
            </div>
            <select
              className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedJobId}
              onChange={event => setSelectedJobId(event.target.value)}
            >
              <option value="">Select a job</option>
              {customJobDescription ? (
                <option value="custom">Uploaded JD (custom)</option>
              ) : null}
              {jobDescriptions.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.company}
                </option>
              ))}
            </select>
            {(selectedJob || (selectedJobId === "custom" && customJobDescription)) ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="font-medium text-slate-700">{jobTitle || "Custom job description"}</div>
                <p className="mt-1 line-clamp-6 whitespace-pre-wrap">{jobDescriptionText}</p>
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
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

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Ranked Results</h2>
          {rankedResults.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No results yet. Run ranking to see scores.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {rankedResults.map(result => {
                const resume = resumes.find(item => item.id === result.resume_id);
                return (
                  <div
                    key={`${result.candidate_id}-${result.resume_id}`}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          Rank #{result.rank} • Score {result.score}
                        </div>
                        <div className="text-xs text-slate-500">
                          {resume?.candidate_name ? `${resume.candidate_name} — ` : ""}
                          {resume?.name ?? result.resume_id}
                        </div>
                      </div>
                      {result.priority ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          {result.priority}
                        </span>
                      ) : null}
                    </div>
                    {result.notes ? (
                      <p className="mt-2 text-xs text-slate-600">{result.notes}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
