"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  addResumesToProject,
  deleteProject,
  getProject,
  getProjectContext,
  listReports,
  listRuns,
  removeResumeFromProject,
  setProjectContext,
  streamProjectRun,
  updateProject,
  type Project,
  type ProjectReport,
  type ProjectRun,
  type RankedCandidate,
  type StreamEvent,
} from "@/lib/projects-api";
import { fetchFromApi } from "@/lib/api";

const DEFAULT_ORG = "global";

// ── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 90 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    score >= 75 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
    score >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 border-rose-500/20";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {score}
    </span>
  );
}

// ── Run Modal ────────────────────────────────────────────────────────────────
const RUN_TYPES = [
  { value: "top_n", label: "Top N Candidates", icon: "🏆", description: "Rank best overall candidates" },
  { value: "leadership", label: "Leadership Fit", icon: "👔", description: "Assess leadership qualities" },
  { value: "skill_based", label: "Skill Match", icon: "🔧", description: "Rank by specific skill set" },
  { value: "specific_skill", label: "Single Skill", icon: "🎯", description: "Focus on one key skill" },
  { value: "custom_prompt", label: "Custom Prompt", icon: "✏️", description: "Your own assessment criteria" },
  { value: "salary_fit", label: "Salary Fit", icon: "💰", description: "Match within salary budget" },
];

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
  const [customPrompt, setCustomPrompt] = useState("");
  const [specificSkill, setSpecificSkill] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  async function handleRun() {
    setIsStreaming(true);
    setEvents([]);
    const params: Record<string, unknown> = { top_n: topN };
    if (runType === "custom_prompt") params.custom_prompt = customPrompt;
    if (runType === "specific_skill") params.specific_skill = specificSkill;
    if (runType === "salary_fit") params.max_salary = maxSalary;
    try {
      await streamProjectRun(projectId, runType, params, DEFAULT_ORG, (ev) => {
        setEvents((prev) => [...prev, ev]);
      });
    } finally {
      setIsStreaming(false);
      // Don't close modal here — let user read results, then click Done
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-bold text-foreground">New AI Assessment Run</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>

        {!isStreaming && events.length === 0 ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {RUN_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setRunType(rt.value)}
                  className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition ${
                    runType === rt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-lg shrink-0">{rt.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${runType === rt.value ? "text-primary" : "text-foreground"}`}>{rt.label}</p>
                    <p className="text-xs text-muted-foreground">{rt.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Top N candidates
                <input type="number" min={1} max={20} value={topN} onChange={e => setTopN(Number(e.target.value))}
                  className="input h-9 w-24 text-sm" />
              </label>
              {runType === "custom_prompt" && (
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Assessment prompt
                  <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={3}
                    className="input h-auto resize-none text-sm" placeholder="Describe your assessment criteria…" />
                </label>
              )}
              {runType === "specific_skill" && (
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Skill to focus on
                  <input value={specificSkill} onChange={e => setSpecificSkill(e.target.value)}
                    className="input h-9 text-sm" placeholder="e.g. Python, SQL, leadership" />
                </label>
              )}
              {runType === "salary_fit" && (
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Max salary budget
                  <input value={maxSalary} onChange={e => setMaxSalary(e.target.value)}
                    className="input h-9 text-sm" placeholder="e.g. $120,000" />
                </label>
              )}
            </div>

            <button onClick={handleRun}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Run
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <div ref={logRef} className="bg-muted rounded-lg p-3 h-64 overflow-y-auto space-y-1 font-mono text-xs">
              {events.map((ev, i) => (
                <div key={i} className={
                  ev.type === "error" ? "text-rose-400" :
                  ev.type === "complete" ? "text-emerald-400 font-semibold" :
                  ev.type === "result" ? "text-primary" : "text-muted-foreground"
                }>
                  {ev.type === "status" ? `▶ ${ev.message}` :
                   ev.type === "result" ? `✓ Results: ${Array.isArray(ev.data) ? ev.data.length : 0} candidates ranked` :
                   ev.type === "complete" ? "✓ Run complete" :
                   ev.type === "error" ? `✗ ${ev.message}` : JSON.stringify(ev)}
                </div>
              ))}
              {isStreaming && <div className="text-muted-foreground animate-pulse">Running…</div>}
            </div>
            {!isStreaming && (
              <button onClick={() => { onComplete(); onClose(); }}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Resume Picker Modal ───────────────────────────────────────────────────────
function ResumePickerModal({
  projectResumeIds,
  onAdd,
  onClose,
}: {
  projectResumeIds: string[];
  onAdd: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"search" | "upload">("search");

  // ── Search tab state ──
  const [search, setSearch] = useState("");
  const [allResumes, setAllResumes] = useState<Array<{ id: string; name: string; candidate_name: string; summary?: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingList, setLoadingList] = useState(true);

  // ── Upload tab state ──
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetchFromApi(`/api/recruiter-ranking/resumes?org_id=${DEFAULT_ORG}&limit=100`)
      .then((d) => setAllResumes((d as { items?: typeof allResumes })?.items ?? []))
      .catch(() => setAllResumes([]))
      .finally(() => setLoadingList(false));
  }, []);

  const filtered = allResumes.filter(r =>
    !projectResumeIds.includes(r.id) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) ||
     (r.candidate_name ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError("");
    const newIds: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${f.name}`);
        const formData = new FormData();
        formData.append("file", f);
        formData.append("user_id", f.name.replace(/\.[^.]+$/, ""));
        formData.append("resume_type", "applicant");
        formData.append("org_id", DEFAULT_ORG);
        const res = await fetch("/api/resumes", { method: "POST", body: formData });
        if (!res.ok) throw new Error(`Upload failed for ${f.name}: ${res.statusText}`);
        const data = await res.json();
        const newId: string = data.id ?? data._id ?? data.resume_id ?? "";
        if (newId) newIds.push(newId);
      }
      if (newIds.length > 0) {
        onAdd(newIds);
        onClose();
      } else {
        throw new Error("No resume IDs returned");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setUploadProgress("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-bold text-foreground">Add Resumes to Project</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["search", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "search" ? "Search Existing" : "Upload New"}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === "search" ? (
            <>
              <input
                type="text" placeholder="Search candidates…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="input h-9 text-sm w-full"
              />
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {loadingList && <p className="text-xs text-muted-foreground py-4 text-center">Loading resumes…</p>}
                {!loadingList && filtered.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No resumes found</p>}
                {filtered.map(r => (
                  <label key={r.id} className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition ${
                    selected.has(r.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}>
                    <input type="checkbox" checked={selected.has(r.id)}
                      onChange={e => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(r.id); else next.delete(r.id);
                        setSelected(next);
                      }}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.candidate_name}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button
                disabled={selected.size === 0}
                onClick={() => { onAdd(Array.from(selected)); onClose(); }}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Add {selected.size > 0 ? `${selected.size} resume${selected.size > 1 ? "s" : ""}` : "Resumes"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Resume Files (select multiple)</label>
                <label className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
                  files.length > 0 ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}>
                  <input type="file" accept=".pdf,.doc,.docx" multiple className="hidden"
                    onChange={e => { setFiles(Array.from(e.target.files ?? [])); setUploadError(""); }} />
                  <svg className={`h-8 w-8 ${files.length > 0 ? "text-primary" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {files.length > 0 ? (
                    <div className="text-center">
                      <p className="text-xs font-medium text-primary">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{files.map(f => f.name).join(", ")}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground text-center">Click to browse (select multiple)<br /><span className="text-zinc-600">PDF, DOC, DOCX</span></span>
                  )}
                </label>
              </div>
              {uploadProgress && <p className="text-xs text-primary">{uploadProgress}</p>}
              {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
              <button
                disabled={files.length === 0 || uploading}
                onClick={handleUpload}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
              >
                {uploading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {uploading ? (uploadProgress || "Uploading…") : `Upload ${files.length > 0 ? files.length + " File" + (files.length > 1 ? "s" : "") : ""} & Add`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<ProjectRun[]>([]);
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [context, setContextText] = useState("");
  const [contextDraft, setContextDraft] = useState("");
  const [contextSaving, setContextSaving] = useState(false);
  const [prompts, setPrompts] = useState<Array<{ name: string; content: string; metadata?: { description?: string } }>>([]);
  const [resumeNames, setResumeNames] = useState<Record<string, string>>({});
  const [selectedRun, setSelectedRun] = useState<ProjectRun | null>(null);
  const [activeTab, setActiveTab] = useState<"runs" | "context" | "resumes">("resumes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRunModal, setShowRunModal] = useState(false);
  const [showResumePicker, setShowResumePicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function handleDeleteProject() {
    if (!project) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      router.push("/recruiters/projects");
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const fetchAll = useCallback(async () => {
    try {
      const [proj, runList, reportList, ctx] = await Promise.all([
        getProject(projectId),
        listRuns(projectId),
        listReports(projectId),
        getProjectContext(projectId).catch(() => ({ context: "" })),
      ]);
      setProject(proj);
      setRuns(runList);
      setReports(reportList);
      setContextText(ctx.context ?? "");
      setContextDraft(ctx.context ?? "");
      if (runList.length > 0 && !selectedRun) setSelectedRun(runList[0]);

      // Fetch names for resumes in this project
      if (proj.resume_ids?.length > 0) {
        fetch(`/api/recruiter-ranking/resumes?org_id=global&limit=200`)
          .then(r => r.ok ? r.json() : { items: [] })
          .then((d: { items?: Array<{ id: string; name: string }> }) => {
            const map: Record<string, string> = {};
            (d.items ?? []).forEach(r => { map[r.id] = r.name; });
            setResumeNames(map);
          })
          .catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedRun]);

  // Load admin prompts for context presets (once)
  useEffect(() => {
    fetch("/api/admin/prompts")
      .then(r => r.ok ? r.json() : { prompts: [] })
      .then(d => setPrompts(d.prompts ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [projectId]); // eslint-disable-line

  async function handleAddResumes(ids: string[]) {
    try {
      await addResumesToProject(projectId, ids);
      fetchAll(); // refresh project + resume names
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add resumes");
    }
  }

  async function handleRemoveResume(resumeId: string) {
    try {
      const updated = await removeResumeFromProject(projectId, resumeId);
      setProject(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove resume");
    }
  }

  async function handleSaveContext() {
    setContextSaving(true);
    try {
      const result = await setProjectContext(projectId, contextDraft);
      setContextText(result.context);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save context");
    } finally {
      setContextSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
          onComplete={() => { setShowRunModal(false); fetchAll(); }}
        />
      )}
      {showResumePicker && (
        <ResumePickerModal
          projectResumeIds={project.resume_ids}
          onAdd={handleAddResumes}
          onClose={() => setShowResumePicker(false)}
        />
      )}

      <div className="flex h-full" style={{ height: "calc(100vh - 56px)" }}>
        {/* ── LEFT: Project Info ── */}
        <aside className="w-72 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border">
            <Link href="/recruiters/projects" className="text-xs text-muted-foreground hover:text-primary mb-2 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Projects
            </Link>
            <h1 className="text-sm font-bold text-foreground leading-tight mt-1">{project.name}</h1>
            {project.description && <p className="text-xs text-muted-foreground mt-1">{project.description}</p>}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete project
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-rose-400">Are you sure?</span>
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            {(["resumes", "runs", "context"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "resumes" ? `Resumes (${project.resume_ids.length})` :
                 tab === "runs" ? `Runs (${runs.length})` : "Context"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* RESUMES TAB */}
            {activeTab === "resumes" && (
              <div className="p-3 space-y-2">
                <button onClick={() => setShowResumePicker(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 py-2 text-xs text-primary hover:bg-primary/5 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Resumes
                </button>
                {project.resume_ids.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No resumes attached.</p>
                    <p className="text-xs text-muted-foreground mt-1">Add resumes to run AI assessments.</p>
                  </div>
                ) : (
                  project.resume_ids.map((rid) => (
                    <div key={rid} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {resumeNames[rid] ?? `Resume …${rid.slice(-6)}`}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{rid.slice(-8)}</p>
                      </div>
                      <button onClick={() => handleRemoveResume(rid)}
                        className="text-xs text-muted-foreground hover:text-rose-400 ml-2 shrink-0">✕</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* RUNS TAB */}
            {activeTab === "runs" && (
              <div className="p-3 space-y-2">
                {runs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No runs yet.</p>
                  </div>
                ) : (
                  runs.map(run => (
                    <button key={run.id} onClick={() => setSelectedRun(run)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 transition ${
                        selectedRun?.id === run.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <p className="text-xs font-semibold text-foreground">{run.run_label || run.run_type}</p>
                      <p className="text-xs text-muted-foreground">{run.ranked?.length ?? 0} candidates · {new Date(run.created_at).toLocaleDateString()}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* CONTEXT TAB */}
            {activeTab === "context" && (
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Assessment Context</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Set the context and criteria for AI runs. This is appended to every AI assessment prompt.
                  </p>
                </div>

                {/* Preset prompt buttons */}
                {prompts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Load from preset:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prompts.map(p => (
                        <button
                          key={p.name}
                          onClick={() => setContextDraft(prev =>
                            prev ? `${prev}\n\n---\n${p.content}` : p.content
                          )}
                          title={p.metadata?.description ?? p.name}
                          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors capitalize"
                        >
                          {p.name.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">Click to append preset · edit below to customise</p>
                  </div>
                )}

                <textarea
                  value={contextDraft}
                  onChange={e => setContextDraft(e.target.value)}
                  rows={10}
                  className="input h-auto resize-none text-xs w-full"
                  placeholder={`e.g.\n- Focus on candidates with 5+ years experience\n- Leadership potential is important\n- Must have experience with distributed systems\n- Prefer candidates open to remote work`}
                />
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveContext} disabled={contextSaving || contextDraft === context}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
                    {contextSaving ? "Saving…" : "Save Context"}
                  </button>
                  {contextDraft !== context && (
                    <button onClick={() => setContextDraft(context)}
                      className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                      Reset
                    </button>
                  )}
                  {contextDraft && (
                    <button onClick={() => setContextDraft("")}
                      className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-rose-400">
                      Clear
                    </button>
                  )}
                </div>
                {context && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                    <p className="text-xs text-emerald-400 font-medium">✓ Context active — applied to all AI runs</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Run button — sticky bottom */}
          <div className="p-3 border-t border-border">
            <button
              onClick={() => setShowRunModal(true)}
              disabled={project.resume_ids.length === 0}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run AI Assessment
            </button>
            {project.resume_ids.length === 0 && (
              <p className="text-center text-xs text-muted-foreground mt-1.5">Add resumes to enable runs</p>
            )}
          </div>
        </aside>

        {/* ── RIGHT: Results ── */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-muted/20">
          {!selectedRun ? (
            <div className="flex flex-col items-center justify-center h-full py-32 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Ready to assess</h2>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                {project.resume_ids.length === 0
                  ? "Add resumes on the left, then run an AI assessment."
                  : "Click \"Run AI Assessment\" to start ranking candidates."}
              </p>
              <div className="mt-4 flex gap-3 text-sm text-muted-foreground">
                <span className={`flex items-center gap-1.5 ${project.resume_ids.length > 0 ? "text-emerald-400" : ""}`}>
                  {project.resume_ids.length > 0 ? "✓" : "○"} {project.resume_ids.length} resume{project.resume_ids.length !== 1 ? "s" : ""}
                </span>
                <span className={`flex items-center gap-1.5 ${context ? "text-emerald-400" : ""}`}>
                  {context ? "✓" : "○"} {context ? "Context set" : "No context"}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Run header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">{selectedRun.run_label || selectedRun.run_type}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedRun.created_at).toLocaleString()} · {selectedRun.ranked?.length ?? 0} candidates
                  </p>
                </div>
                {selectedRun.run_notes && (
                  <div className="max-w-xs rounded-lg border border-border bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{selectedRun.run_notes}</p>
                  </div>
                )}
              </div>

              {/* Ranked candidates */}
              {(selectedRun.ranked ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No ranked candidates in this run.</p>
              ) : (
                <div className="space-y-3">
                  {selectedRun.ranked.map((c: RankedCandidate) => (
                    <div key={c.resume_id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            #{c.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{c.name || `Resume ${c.rank}`}</p>
                            <p className="text-xs text-muted-foreground font-mono">{c.resume_id.slice(-8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ScoreBadge score={c.score} />
                          {c.recommendation && (
                            <span className="text-xs text-muted-foreground">{c.recommendation}</span>
                          )}
                        </div>
                      </div>
                      {c.summary && <p className="text-xs text-muted-foreground">{c.summary}</p>}
                      {(c.strengths?.length > 0 || c.gaps?.length > 0) && (
                        <div className="flex gap-4 pt-1">
                          {c.strengths?.length > 0 && (
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                              <div className="flex flex-wrap gap-1">
                                {c.strengths.map(s => (
                                  <span key={s} className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {c.gaps?.length > 0 && (
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-amber-400 mb-1">Gaps</p>
                              <div className="flex flex-wrap gap-1">
                                {c.gaps.map(g => (
                                  <span key={g} className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">{g}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
