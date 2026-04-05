"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createProject, updateProject, listProjects, type Project } from "@/lib/projects-api";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";

const DEFAULT_ORG = "global";

interface JDOption { id: string; title: string; company?: string; }
interface Company { id: string; name: string; }

function ScoreBadge({ count }: { count: number }) {
  return (
    <Badge variant="primary" size="sm">
      {count} run{count !== 1 ? "s" : ""}
    </Badge>
  );
}

function ExpiryBadge({ endDate }: { endDate: string | null }) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (daysLeft < 0) return <span className="text-[10px] font-medium text-red-400">Expired</span>;
  if (daysLeft <= 3) return <span className="text-[10px] font-medium text-red-400">{daysLeft}d left</span>;
  if (daysLeft <= 7) return <span className="text-[10px] font-medium text-amber-400">{daysLeft}d left</span>;
  return <span className="text-[10px] text-muted-foreground">{daysLeft}d left</span>;
}

function ProjectCard({ project, onArchive, companyName }: { project: Project; onArchive: (id: string) => void; companyName?: string; }) {
  const resumeCount = project.resume_ids?.length ?? 0;
  const updatedAt = new Date(project.updated_at).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : null;
  const [confirmArchive, setConfirmArchive] = useState(false);

  return (
    <Card hoverable className="group relative p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {companyName && (
            <p className="text-xs text-primary/80 font-semibold mb-0.5">{companyName}</p>
          )}
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{project.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex h-2 w-2 rounded-full ${project.status === "active" ? "bg-emerald-400" : "bg-zinc-500"}`} />
            <span className="text-xs text-muted-foreground capitalize">{project.status}</span>
            <ExpiryBadge endDate={project.end_date} />
          </div>
          {(project.start_date || project.end_date) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {fmtDate(project.start_date) ?? "—"} → {fmtDate(project.end_date) ?? "—"}
            </p>
          )}
          {project.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{project.description}</p>
          )}
        </div>
        {/* Archive controls — z-10 so they sit above the Link overlay */}
        <div className="relative z-10 shrink-0">
          {project.status === "active" && (
            !confirmArchive ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmArchive(true); }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded p-1 text-muted-foreground hover:text-amber-400 transition-all"
                title="Archive job role"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <button onClick={() => onArchive(project.id)} className="text-xs font-medium text-amber-400 hover:text-amber-300">Archive</button>
                <button onClick={() => setConfirmArchive(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
            )
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">{resumeCount} resume{resumeCount !== 1 ? "s" : ""}</span>
        <ScoreBadge count={project.run_count ?? 0} />
        <span className="text-xs text-muted-foreground ml-auto">Updated {updatedAt}</span>
      </div>

      <Link href={`/recruiters/projects/${project.id}`} className="absolute inset-0 rounded-xl" aria-label={`Open ${project.name}`} />
    </Card>
  );
}

function NewProjectModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (p: Project) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Step 2 — search tab
  const [jdTab, setJdTab] = useState<"search" | "upload">("search");
  const [jdOptions, setJdOptions] = useState<JDOption[]>([]);
  const [jdSearch, setJdSearch] = useState("");
  const [selectedJdId, setSelectedJdId] = useState<string | null>(null);
  const [loadingJds, setLoadingJds] = useState(false);

  // Step 2 — upload tab
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [uploadingJd, setUploadingJd] = useState(false);
  const [uploadedJdId, setUploadedJdId] = useState<string | null>(null);
  const [uploadedJdTitle, setUploadedJdTitle] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/companies?org_id=${DEFAULT_ORG}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() as Promise<{ items?: Company[] }> : null)
      .then(d => setCompanies(d?.items ?? []))
      .catch(() => setCompanies([]));
  }, []);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    setCreatingCompany(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      });
      if (res.ok) {
        const company = await res.json() as Company;
        setCompanies(prev => [...prev, company]);
        setSelectedCompanyId(company.id);
        setNewCompanyName("");
      }
    } catch { /* ignore */ }
    finally { setCreatingCompany(false); }
  };

  useEffect(() => {
    if (step === 2 && jdTab === "search") {
      setLoadingJds(true);
      fetch(`/api/jobs/descriptions?org_id=${DEFAULT_ORG}&limit=50`, { cache: "no-store" })
        .then(r => r.ok ? r.json() as Promise<{ items?: JDOption[] }> : null)
        .then(d => setJdOptions(d?.items ?? []))
        .catch(() => setJdOptions([]))
        .finally(() => setLoadingJds(false));
    }
  }, [step, jdTab]);

  const filteredJds = jdOptions.filter(jd =>
    jd.title?.toLowerCase().includes(jdSearch.toLowerCase()) ||
    (jd.company ?? "").toLowerCase().includes(jdSearch.toLowerCase())
  );

  async function handleUploadJd() {
    if (!jdFile) return;
    setUploadingJd(true);
    setError("");
    try {
      const inferredTitle = jdFile.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const formData = new FormData();
      formData.append("file", jdFile);
      formData.append("title", inferredTitle);
      formData.append("org_id", DEFAULT_ORG);
      const res = await fetch("/api/jobs/upload-jd", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { detail?: string; error?: string };
        throw new Error(errData.detail ?? errData.error ?? `Upload failed (${res.status})`);
      }
      const data = await res.json() as { id?: string; _id?: string; job_id?: string; title?: string };
      const id = data.id ?? data._id ?? data.job_id ?? "";
      const title = data.title ?? inferredTitle;
      if (!id) throw new Error("No JD ID returned");
      setUploadedJdId(id);
      setUploadedJdTitle(title);
      setSelectedJdId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingJd(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJdId) { setError("Please select or upload a job description"); return; }
    setSaving(true);
    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim(),
        org_id: DEFAULT_ORG,
        job_id: selectedJdId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        company_id: selectedCompanyId || undefined,
      });
      onCreate(project);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-sm font-bold text-foreground">New Job Role</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 2 — {step === 1 ? "Job role details" : "Attach a Job Description"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {/* Step indicators */}
        <div className="flex px-5 py-3 gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 ? (
          <div className="px-5 pb-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Job Role Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
                placeholder="e.g. Data Engineer – Q3 2025"
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                placeholder="Notes about this job role…"
                className="input w-full text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Company <span className="text-muted-foreground font-normal">(optional)</span></label>
              <div className="flex gap-2">
                <select
                  value={selectedCompanyId}
                  onChange={e => setSelectedCompanyId(e.target.value)}
                  className="input flex-1 text-sm"
                >
                  <option value="">— Select a company —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  placeholder="Or create new company…"
                  className="input flex-1 text-sm"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateCompany(); } }}
                />
                <button
                  type="button"
                  onClick={handleCreateCompany}
                  disabled={!newCompanyName.trim() || creatingCompany}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40"
                >
                  {creatingCompany ? "…" : "+ Add"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ad Start Date <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ad End Date <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="input w-full text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="button" disabled={!name.trim()} onClick={() => setStep(2)}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
                Next: Job Description →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pb-5">
            {/* JD tabs */}
            <div className="flex border-b border-border">
              {(["search", "upload"] as const).map(t => (
                <button key={t} type="button" onClick={() => { setJdTab(t); setError(""); }}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                    jdTab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {t === "search" ? "Search Existing" : "Upload New JD"}
                </button>
              ))}
            </div>

            <div className="px-5 pt-4 space-y-3">
              {jdTab === "search" ? (
                <>
                  <input type="text" placeholder="Search job descriptions…" value={jdSearch}
                    onChange={e => setJdSearch(e.target.value)}
                    className="input w-full text-sm" />
                  <div className="max-h-52 overflow-y-auto space-y-1.5">
                    {loadingJds && <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>}
                    {!loadingJds && filteredJds.length === 0 && (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        No job descriptions found.<br />
                        <button type="button" onClick={() => setJdTab("upload")} className="text-primary hover:underline mt-1">Upload one instead →</button>
                      </p>
                    )}
                    {filteredJds.map(jd => (
                      <button key={jd.id} type="button" onClick={() => setSelectedJdId(jd.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition ${
                          selectedJdId === jd.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
                        }`}>
                        <p className={`text-xs font-semibold ${selectedJdId === jd.id ? "text-primary" : "text-foreground"}`}>{jd.title}</p>
                        {jd.company && <p className="text-xs text-muted-foreground">{jd.company}</p>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {uploadedJdId ? (
                    <div className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 flex items-center gap-3">
                      <span className="text-primary text-lg">✓</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{uploadedJdTitle}</p>
                        <p className="text-xs text-muted-foreground">JD uploaded and selected</p>
                      </div>
                      <button type="button" onClick={() => { setUploadedJdId(null); setJdFile(null); setSelectedJdId(null); }}
                        className="ml-auto text-muted-foreground hover:text-foreground text-xs">Change</button>
                    </div>
                  ) : (
                    <>
                      <label
                        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
                          jdFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) { setJdFile(file); setError(""); }
                        }}
                      >
                        <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                          onChange={e => { setJdFile(e.target.files?.[0] ?? null); setError(""); }} />
                        <svg className={`h-8 w-8 ${jdFile ? "text-primary" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {jdFile ? (
                          <span className="text-xs font-medium text-primary">{jdFile.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground text-center">Click to browse JD file<br /><span className="text-zinc-600">PDF, DOC, DOCX, TXT</span></span>
                        )}
                      </label>
                      <button type="button" disabled={!jdFile || uploadingJd} onClick={handleUploadJd}
                        className="w-full rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                        {uploadingJd && <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                        {uploadingJd ? "Uploading…" : "Upload JD"}
                      </button>
                    </>
                  )}
                </>
              )}

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  ← Back
                </button>
                <button type="submit" disabled={saving || !selectedJdId}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
                  {saving ? "Creating…" : "Create Job Role"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"newest" | "end_date" | "start_date">("newest");
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const [data, companiesRes] = await Promise.all([
        listProjects(DEFAULT_ORG),
        fetch(`/api/companies?org_id=${DEFAULT_ORG}`, { cache: "no-store" }).then(r => r.ok ? r.json() as Promise<{ items?: Company[] }> : null).catch(() => null),
      ]);
      setProjects(data.items);
      setTotal(data.total);
      const map: Record<string, string> = {};
      (companiesRes?.items ?? []).forEach(c => { map[c.id] = c.name; });
      setCompanyMap(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function requestArchive(id: string) {
    setArchiveTargetId(id);
  }

  async function confirmArchiveProject() {
    if (!archiveTargetId) return;
    try {
      await updateProject(archiveTargetId, { status: "archived" });
      setProjects((p) => p.map((x) => x.id === archiveTargetId ? { ...x, status: "archived" as const } : x));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setArchiveTargetId(null);
    }
  }

  const uniqueCompanyIds = [...new Set(projects.map(p => p.company_id).filter(Boolean))] as string[];

  const filteredProjects = projects
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => companyFilter === "all" || p.company_id === companyFilter)
    .sort((a, b) => {
      if (sortMode === "end_date") {
        const aEnd = a.end_date ? new Date(a.end_date).getTime() : Infinity;
        const bEnd = b.end_date ? new Date(b.end_date).getTime() : Infinity;
        return aEnd - bEnd;
      }
      if (sortMode === "start_date") {
        const aStart = a.start_date ? new Date(a.start_date).getTime() : Infinity;
        const bStart = b.start_date ? new Date(b.start_date).getTime() : Infinity;
        return aStart - bStart;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={(p) => { setProjects((prev) => [p, ...prev]); setTotal((t) => t + 1); setShowModal(false); }}
        />
      )}

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Roles</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total > 0 ? `${total} job role${total !== 1 ? "s" : ""}` : "No job roles yet"} — each job role groups a JD with all applicants, AI runs, and reports.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Job Role
          </button>
        </div>

        {/* Filter + Sort */}
        {!loading && projects.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap mb-2">
            {uniqueCompanyIds.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground">Company Name</span>
                <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground min-w-[180px]">
                  <option value="all">All Companies</option>
                  {uniqueCompanyIds.map(id => (
                    <option key={id} value={id}>{companyMap[id] || id}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              {(["all", "active", "archived"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${
                    statusFilter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}>{f}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 ml-auto">
              {([["newest", "Newest"], ["end_date", "End Date"], ["start_date", "Start Date"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setSortMode(val)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    sortMode === val ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 p-6 text-center">
            <p className="text-sm text-rose-400">{error}</p>
            <button onClick={fetchProjects} className="mt-3 text-xs text-primary hover:underline">Retry</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">No job roles yet</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Create your first job role to start organizing job descriptions, resumes, and AI assessment runs.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Create First Job Role
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No {statusFilter === "all" ? "" : statusFilter} job roles found.
              </div>
            ) : filteredProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onArchive={requestArchive} companyName={p.company_id ? companyMap[p.company_id] : undefined} />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={archiveTargetId !== null}
        title="Archive Job Role"
        message="Archive this job role? It will be moved to the archived tab and can be restored later."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void confirmArchiveProject()}
        onCancel={() => setArchiveTargetId(null)}
      />
    </div>
  );
}
