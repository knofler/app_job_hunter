"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import {
  addResumesToProject,
  createCombinedReport,
  getProject,
  listReports,
  listRuns,
  removeResumeFromProject,
  streamProjectRun,
  updateProject,
  type Project,
  type ProjectReport,
  type ProjectRun,
  type RankedCandidate,
  type StreamEvent,
} from "@/lib/projects-api";

const DEFAULT_ORG = "global";

// ── Score badge ────────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 90 ? "bg-emerald-500/10 text-emerald-400" :
    score >= 75 ? "bg-blue-500/10 text-blue-400" :
    score >= 60 ? "bg-amber-500/10 text-amber-400" :
    score >= 40 ? "bg-orange-500/10 text-orange-400" :
                  "bg-rose-500/10 text-rose-400";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{score}%</span>;
}

// ── Ranked candidate card ──────────────────────────────────────────────────────
function CandidateCard({ candidate }: { candidate: RankedCandidate }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">#{candidate.rank}</span>
            <h4 className="font-semibold text-foreground">{candidate.name || "Unknown"}</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{candidate.summary}</p>
        </div>
        <ScoreBadge score={candidate.score} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.strengths?.slice(0, 3).map((s) => (
          <span key={s} className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">{s}</span>
        ))}
        {candidate.gaps?.slice(0, 2).map((g) => (
          <span key={g} className="rounded bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">{g}</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">Rec: </span>{candidate.recommendation}
      </p>
    </div>
  );
}

// ── Run type config ─────────────────────────────────────────────────────────────
const RUN_TYPES = [
  { id: "top_n", label: "Top N Candidates", icon: "🏆", description: "Rank the overall best candidates" },
  { id: "leadership", label: "Leadership Focus", icon: "👔", description: "Weight leadership and management qualities" },
  { id: "skills", label: "Skills Match", icon: "🛠", description: "Rank by technical skills alignment" },
  { id: "specific_skill", label: "Specific Skill", icon: "🎯", description: "Find experts in one skill" },
  { id: "salary_fit", label: "Salary Fit", icon: "💰", description: "Match candidates within budget" },
  { id: "custom", label: "Custom Prompt", icon: "✏️", description: "Write your own assessment criteria" },
];

// ── New Run modal ──────────────────────────────────────────────────────────────
function NewRunModal({
  projectId,
  onClose,
  onComplete,
}: {
  projectId: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [runType, setRunType] = useState("top_n");
  const [topN, setTopN] = useState(5);
  const [specificSkill, setSpecificSkill] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  async function startRun() {
    setStreaming(true);
    setEvents([]);
    setError("");
    const params: Record<string, unknown> = { top_n: topN };
    if (specificSkill) params.specific_skill = specificSkill;
    if (maxSalary) params.max_salary = maxSalary;
    if (customPrompt) params.custom_prompt = customPrompt;

    try {
      await streamProjectRun(projectId, runType, params, DEFAULT_ORG, (event) => {
        setEvents((prev) => [...prev, event]);
        if (event.type === "complete") setDone(true);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Stream failed");
    } finally {
      setStreaming(false);
    }
  }

  const resultEvent = events.find((e) => e.type === "result") as Extract<StreamEvent, { type: "result" }> | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New AI Assessment Run</h2>
          <button onClick={onClose} disabled={streaming} className="text-muted-foreground hover:text-foreground">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {!streaming && !done && (
            <>
              {/* Run type selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Assessment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {RUN_TYPES.map((rt) => (
                    <button
                      key={rt.id}
                      onClick={() => setRunType(rt.id)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        runType === rt.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 hover:border-border/80"
                      }`}
                    >
                      <span className="text-base">{rt.icon}</span>
                      <p className="text-sm font-medium text-foreground mt-1">{rt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Params */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Top N candidates</label>
                  <input
                    type="number" min={1} max={20} value={topN}
                    onChange={(e) => setTopN(parseInt(e.target.value) || 5)}
                    className="w-24 rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                {runType === "specific_skill" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Skill to focus on</label>
                    <input type="text" value={specificSkill} onChange={(e) => setSpecificSkill(e.target.value)}
                      placeholder="e.g. Apache Spark, Kubernetes"
                      className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
                {runType === "salary_fit" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Max salary / budget</label>
                    <input type="text" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)}
                      placeholder="e.g. $150,000 AUD"
                      className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
                {runType === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Custom assessment prompt</label>
                    <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3} placeholder="Describe how you want candidates ranked…"
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Streaming log */}
          {(streaming || done || events.length > 0) && (
            <div ref={scrollRef} className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 overflow-y-auto max-h-48">
              {events.map((ev, i) => (
                <div key={i} className={`text-xs flex items-start gap-2 ${
                  ev.type === "error" ? "text-rose-400" :
                  ev.type === "complete" ? "text-emerald-400" :
                  ev.type === "result" ? "text-primary" : "text-muted-foreground"
                }`}>
                  <span className="font-mono">{ev.type === "status" ? "⟳" : ev.type === "result" ? "✓" : ev.type === "complete" ? "✅" : "✗"}</span>
                  <span>{"message" in ev ? ev.message : ev.type === "result" ? `${ev.data?.length ?? 0} candidates ranked — Run ID: ${ev.run_id}` : "Complete"}</span>
                </div>
              ))}
              {streaming && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Running AI assessment…
                </div>
              )}
            </div>
          )}

          {/* Results preview */}
          {resultEvent && resultEvent.data && resultEvent.data.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Top Results</h3>
              {resultEvent.data.slice(0, 3).map((c) => (
                <CandidateCard key={c.resume_id} candidate={c} />
              ))}
              {resultEvent.data.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">+{resultEvent.data.length - 3} more — view full run in Runs tab</p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex gap-3">
          {!done ? (
            <>
              <button onClick={onClose} disabled={streaming} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={startRun} disabled={streaming} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {streaming ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Running…</> : "Start Run"}
              </button>
            </>
          ) : (
            <button onClick={() => { onComplete(); onClose(); }} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
              Done — View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Run list item ───────────────────────────────────────────────────────────────
function RunItem({ run, onSelect, selected }: { run: ProjectRun; selected: boolean; onSelect: () => void }) {
  const rtConfig = RUN_TYPES.find((r) => r.id === run.run_type);
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{rtConfig?.icon ?? "🤖"}</span>
        <span className="text-sm font-medium text-foreground truncate">{run.run_label}</span>
        <span className="ml-auto text-xs text-muted-foreground">{run.ranked?.length ?? 0} results</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(run.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </p>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<ProjectRun[]>([]);
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [selectedRun, setSelectedRun] = useState<ProjectRun | null>(null);
  const [activeTab, setActiveTab] = useState<"runs" | "reports">("runs");
  const [showRunModal, setShowRunModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingResumes, setAddingResumes] = useState(false);
  const [newResumeIds, setNewResumeIds] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [proj, runList, reportList] = await Promise.all([
        getProject(projectId),
        listRuns(projectId),
        listReports(projectId),
      ]);
      setProject(proj);
      setRuns(runList);
      setReports(reportList);
      if (runList.length > 0 && !selectedRun) setSelectedRun(runList[0]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedRun]);

  useEffect(() => { fetchAll(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddResumes() {
    const ids = newResumeIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (!ids.length) return;
    try {
      const updated = await addResumesToProject(projectId, ids);
      setProject(updated);
      setNewResumeIds("");
      setAddingResumes(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add resumes");
    }
  }

  async function handleRemoveResume(resumeId: string) {
    try {
      const updated = await removeResumeFromProject(projectId, resumeId);
      setProject(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove resume");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    </div>
  );

  if (error || !project) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-rose-400">{error || "Project not found"}</p>
      <Link href="/recruiters/projects" className="mt-4 text-sm text-primary hover:underline">← Back to Projects</Link>
    </div>
  );

  return (
    <>
      {showRunModal && (
        <NewRunModal
          projectId={projectId}
          onClose={() => setShowRunModal(false)}
          onComplete={fetchAll}
        />
      )}

      <div className="flex min-h-screen bg-background">
        {/* ── Left panel: project info + resumes ───────────────────────────── */}
        <aside
          className="w-80 shrink-0 border-r border-border bg-card overflow-y-auto"
          style={{ height: "calc(100vh - 56px)", position: "sticky", top: "56px" }}
        >
          <div className="p-4 border-b border-border">
            <Link href="/recruiters/projects" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-3">
              ← Projects
            </Link>
            <h1 className="font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-xs text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{runs.length} run{runs.length !== 1 ? "s" : ""}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{project.resume_ids?.length ?? 0} resume{(project.resume_ids?.length ?? 0) !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Resumes */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Resumes</h3>
              <button onClick={() => setAddingResumes(!addingResumes)} className="text-xs text-primary hover:underline">
                + Add
              </button>
            </div>

            {addingResumes && (
              <div className="mb-3 space-y-2">
                <textarea
                  value={newResumeIds}
                  onChange={(e) => setNewResumeIds(e.target.value)}
                  rows={2}
                  placeholder="Paste resume IDs (comma or line separated)…"
                  className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setAddingResumes(false)} className="flex-1 text-xs text-muted-foreground border border-border rounded py-1 hover:text-foreground">Cancel</button>
                  <button onClick={handleAddResumes} className="flex-1 text-xs bg-primary text-white rounded py-1 hover:bg-primary-dark">Add</button>
                </div>
              </div>
            )}

            {project.resume_ids && project.resume_ids.length > 0 ? (
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {project.resume_ids.map((rid) => (
                  <li key={rid} className="flex items-center gap-2 text-xs text-muted-foreground group">
                    <span className="h-1.5 w-1.5 rounded-full bg-border flex-none" />
                    <span className="flex-1 font-mono truncate">{rid.slice(0, 20)}…</span>
                    <button
                      onClick={() => handleRemoveResume(rid)}
                      className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300"
                    >×</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No resumes added yet.</p>
            )}
          </div>

          {/* Run button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => setShowRunModal(true)}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              New AI Run
            </button>
          </div>
        </aside>

        {/* ── Right panel: runs + results ───────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-border bg-card px-6 pt-4">
            <div className="flex gap-4">
              {(["runs", "reports"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                    activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab} {tab === "runs" ? `(${runs.length})` : `(${reports.length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {activeTab === "runs" ? (
              <>
                {/* Run list */}
                <div className="w-64 shrink-0 border-r border-border overflow-y-auto p-3 space-y-2">
                  {runs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xs text-muted-foreground">No runs yet</p>
                      <button onClick={() => setShowRunModal(true)} className="mt-2 text-xs text-primary hover:underline">Start first run</button>
                    </div>
                  ) : (
                    runs.map((run) => (
                      <RunItem
                        key={run.id}
                        run={run}
                        selected={selectedRun?.id === run.id}
                        onSelect={() => setSelectedRun(run)}
                      />
                    ))
                  )}
                </div>

                {/* Run results */}
                <div className="flex-1 overflow-y-auto p-5">
                  {!selectedRun ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-muted-foreground text-sm">Select a run to view results</p>
                    </div>
                  ) : (
                    <div className="max-w-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-semibold text-foreground">{selectedRun.run_label}</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedRun.resume_count} resume{selectedRun.resume_count !== 1 ? "s" : ""} assessed ·{" "}
                            {new Date(selectedRun.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 capitalize">{selectedRun.status}</span>
                      </div>

                      {selectedRun.run_notes && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">{selectedRun.run_notes}</p>
                      )}

                      <div className="space-y-3">
                        {selectedRun.ranked && selectedRun.ranked.length > 0 ? (
                          selectedRun.ranked.map((c) => <CandidateCard key={c.resume_id} candidate={c} />)
                        ) : (
                          <p className="text-sm text-muted-foreground">No results in this run.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Reports tab */
              <div className="flex-1 overflow-y-auto p-5">
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-muted-foreground">No combined reports yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Run at least 2 assessments then generate a weighted combined report.</p>
                  </div>
                ) : (
                  <div className="max-w-2xl space-y-6">
                    {reports.map((report) => (
                      <div key={report.id} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-foreground">Combined Report</h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-4">
                          {Object.entries(report.weights).map(([type, weight]) => (
                            <span key={type} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {type}: {Math.round(weight * 100)}%
                            </span>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {report.ranked.map((c, i) => (
                            <div key={c.resume_id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                                <span className="text-sm font-medium text-foreground">{c.name}</span>
                              </div>
                              <ScoreBadge score={c.weighted_score} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
