"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const DEFAULT_ORG = "global";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeOption {
  id: string;
  name: string;
  candidate_name?: string;
}

interface JobOption {
  id: string;
  title: string;
  description?: string;
}

interface SkillMatch {
  skill: string;
  status: "present" | "partial" | "missing";
  evidence: string;
}

interface HiringRec {
  verdict: "hire" | "maybe" | "no";
  rationale: string;
}

interface AssessmentResult {
  executive_summary?: string;
  skills_match?: SkillMatch[];
  experience_quality?: string;
  culture_fit?: string;
  red_flags?: string[];
  strengths?: string[];
  interview_angles?: string[];
  hiring_recommendation?: HiringRec;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VERDICT_STYLES: Record<string, string> = {
  hire: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  maybe: "bg-amber-100 text-amber-800 border border-amber-200",
  no: "bg-red-100 text-red-800 border border-red-200",
};

const SKILL_STATUS_STYLES: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  missing: "bg-red-100 text-red-700",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIAssessmentPage() {
  const searchParams = useSearchParams();

  // Picker state
  const [resumeSearch, setResumeSearch] = useState("");
  const [resumeOptions, setResumeOptions] = useState<ResumeOption[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeOption | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOption | null>(null);
  const [jdPasteMode, setJdPasteMode] = useState(false);
  const [jdText, setJdText] = useState("");
  const [jobsLoaded, setJobsLoaded] = useState(false);

  // Stream state
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<AssessmentResult>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from URL params (set by DeepAssessButton)
  useEffect(() => {
    const resumeId = searchParams.get("resumeId");
    const resumeName = searchParams.get("resumeName");
    const jdId = searchParams.get("jdId");
    const jdTextParam = searchParams.get("jdText");
    if (resumeId) {
      setSelectedResume({ id: resumeId, name: resumeName || resumeId });
      setResumeSearch(resumeName || resumeId);
    }
    if (jdId) {
      setSelectedJob({ id: jdId, title: jdId });
      // load job title async
      fetch(`/api/jobs/${jdId}`).then(r => r.json()).then(j => {
        if (j?.title) setSelectedJob({ id: jdId, title: j.title });
      }).catch(() => {});
    } else if (jdTextParam) {
      setJdPasteMode(true);
      setJdText(jdTextParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Resume search ──────────────────────────────────────────────────────────
  const searchResumes = useCallback(async (q: string) => {
    setResumeLoading(true);
    try {
      const res = await fetch(`/api/resumes?user_id=all&limit=50`);
      const data = await res.json();
      const items: ResumeOption[] = (data.items || data || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name as string) || (r.resume_name as string) || "Unnamed",
        candidate_name: r.candidate_name as string | undefined,
      }));
      const filtered = q
        ? items.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
        : items;
      setResumeOptions(filtered.slice(0, 20));
    } catch {
      setResumeOptions([]);
    } finally {
      setResumeLoading(false);
    }
  }, []);

  // ── Job list ───────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    if (jobsLoaded) return;
    try {
      const res = await fetch(`/api/jobs?org_id=${DEFAULT_ORG}&page_size=100`);
      const data = await res.json();
      const items: JobOption[] = (data.items || []).map((j: Record<string, unknown>) => ({
        id: j.id as string,
        title: (j.title as string) || "Untitled",
        description: j.description as string | undefined,
      }));
      setJobOptions(items);
      setJobsLoaded(true);
    } catch {
      setJobOptions([]);
    }
  }, [jobsLoaded]);

  // ── Run assessment ─────────────────────────────────────────────────────────
  const runAssessment = useCallback(async () => {
    if (!selectedResume) return;
    if (!jdPasteMode && !selectedJob) return;
    if (jdPasteMode && !jdText.trim()) return;

    setRunning(true);
    setDone(false);
    setError("");
    setResult({});
    setStatusMsg("Starting assessment…");

    try {
      const body: Record<string, string> = {
        org_id: DEFAULT_ORG,
        resume_id: selectedResume.id,
      };
      if (jdPasteMode) {
        body.jd_text = jdText;
      } else if (selectedJob) {
        body.jd_id = selectedJob.id;
      }

      const res = await fetch("/api/assessments/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        setError("Failed to start assessment stream.");
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "status") setStatusMsg(ev.message || "");
            if (ev.type === "error") setError(ev.message || "Error");
            if (ev.type === "result") {
              setResult((prev) => ({ ...prev, [ev.step]: ev.data }));
            }
            if (ev.type === "complete") setDone(true);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRunning(false);
    }
  }, [selectedResume, selectedJob, jdPasteMode, jdText]);

  const hasResult = Object.keys(result).length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Deep Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed AI analysis of one resume against one job description.
        </p>
      </div>

      {/* Config card */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resume picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Resume</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search resumes…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={resumeSearch}
                onChange={(e) => {
                  setResumeSearch(e.target.value);
                  searchResumes(e.target.value);
                }}
                onFocus={() => searchResumes(resumeSearch)}
              />
              {resumeLoading && (
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">Loading…</span>
              )}
            </div>
            {resumeOptions.length > 0 && !selectedResume && (
              <ul className="border border-border rounded-lg bg-card shadow-md max-h-48 overflow-y-auto text-sm">
                {resumeOptions.map((r) => (
                  <li
                    key={r.id}
                    className="px-3 py-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedResume(r);
                      setResumeSearch(r.name);
                      setResumeOptions([]);
                    }}
                  >
                    <span className="font-medium">{r.name}</span>
                    {r.candidate_name && (
                      <span className="text-muted-foreground ml-2 text-xs">{r.candidate_name}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {selectedResume && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-600 font-medium">✓ {selectedResume.name}</span>
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={() => {
                    setSelectedResume(null);
                    setResumeSearch("");
                  }}
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* JD picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Job Description</label>
              <button
                className="text-xs text-primary underline"
                onClick={() => setJdPasteMode((v) => !v)}
              >
                {jdPasteMode ? "Pick from list" : "Paste text instead"}
              </button>
            </div>
            {jdPasteMode ? (
              <textarea
                rows={4}
                placeholder="Paste job description here…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            ) : (
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={selectedJob?.id ?? ""}
                onFocus={loadJobs}
                onChange={(e) => {
                  const job = jobOptions.find((j) => j.id === e.target.value) || null;
                  setSelectedJob(job);
                }}
              >
                <option value="">Select a job…</option>
                {jobOptions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Run button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {running && <span className="animate-pulse">{statusMsg}</span>}
            {error && <span className="text-red-600">{error}</span>}
            {done && !running && (
              <span className="text-emerald-600">✓ Assessment complete</span>
            )}
          </div>
          <button
            disabled={
              running ||
              !selectedResume ||
              (!jdPasteMode && !selectedJob) ||
              (jdPasteMode && !jdText.trim())
            }
            onClick={runAssessment}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Assessing…
              </>
            ) : (
              "Run Assessment"
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasResult && (
        <div className="space-y-4">
          {/* Hiring recommendation banner */}
          {result.hiring_recommendation && (
            <div
              className={`flex items-center gap-3 rounded-xl px-5 py-4 ${
                VERDICT_STYLES[result.hiring_recommendation.verdict] || "bg-muted"
              }`}
            >
              <span className="text-xl">
                {result.hiring_recommendation.verdict === "hire"
                  ? "✅"
                  : result.hiring_recommendation.verdict === "maybe"
                  ? "🤔"
                  : "❌"}
              </span>
              <div>
                <p className="font-semibold capitalize">
                  {result.hiring_recommendation.verdict}
                </p>
                <p className="text-sm">{result.hiring_recommendation.rationale}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Executive Summary */}
            <SectionCard
              title="Executive Summary"
              loading={!result.executive_summary && running}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.executive_summary || "—"}
              </p>
            </SectionCard>

            {/* Experience Quality */}
            <SectionCard
              title="Experience Quality"
              loading={!result.experience_quality && running}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.experience_quality || "—"}
              </p>
            </SectionCard>

            {/* Culture Fit */}
            <SectionCard
              title="Culture Fit"
              loading={!result.culture_fit && running}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.culture_fit || "—"}
              </p>
            </SectionCard>

            {/* Strengths */}
            <SectionCard
              title="Strengths"
              loading={!result.strengths && running}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
            >
              {result.strengths && result.strengths.length > 0 ? (
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </SectionCard>
          </div>

          {/* Skills Match */}
          {result.skills_match && result.skills_match.length > 0 && (
            <SectionCard
              title="Skills Match"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-4">Skill</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.skills_match.map((s, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-medium">{s.skill}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              SKILL_STATUS_STYLES[s.status] || "bg-muted"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{s.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Red Flags */}
            <SectionCard
              title="Red Flags"
              loading={!result.red_flags && running}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            >
              {result.red_flags && result.red_flags.length > 0 ? (
                <ul className="space-y-1">
                  {result.red_flags.map((f, i) => (
                    <li key={i} className="text-sm text-red-600 flex gap-2">
                      <span className="mt-0.5">⚠</span>
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-600">No red flags identified.</p>
              )}
            </SectionCard>

            {/* Interview Angles */}
            <SectionCard
              title="Interview Angles"
              loading={!result.interview_angles && running}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
            >
              {result.interview_angles && result.interview_angles.length > 0 ? (
                <ol className="space-y-2">
                  {result.interview_angles.map((q, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                      {q}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
