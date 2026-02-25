"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createProject, deleteProject, listProjects, type Project } from "@/lib/projects-api";

const DEFAULT_ORG = "global";

function ScoreBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {count} run{count !== 1 ? "s" : ""}
    </span>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const resumeCount = project.resume_ids?.length ?? 0;
  const updatedAt = new Date(project.updated_at).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex h-2 w-2 rounded-full ${project.status === "active" ? "bg-emerald-400" : "bg-zinc-500"}`} />
            <span className="text-xs text-muted-foreground capitalize">{project.status}</span>
          </div>
          <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
          {project.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{project.description}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
          className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-rose-400 transition-all"
          title="Delete project"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">{resumeCount} resume{resumeCount !== 1 ? "s" : ""}</span>
        <ScoreBadge count={project.run_count ?? 0} />
        <span className="text-xs text-muted-foreground ml-auto">Updated {updatedAt}</span>
      </div>

      <Link href={`/recruiters/projects/${project.id}`} className="absolute inset-0 rounded-xl" aria-label={`Open ${project.name}`} />
    </div>
  );
}

function NewProjectModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (p: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required"); return; }
    setSaving(true);
    try {
      const project = await createProject({ name: name.trim(), description: description.trim(), org_id: DEFAULT_ORG });
      onCreate(project);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">New Project</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Engineer – Q3 2025"
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this hiring project…"
              rows={3}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listProjects(DEFAULT_ORG);
      setProjects(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this project and all its runs? This cannot be undone.")) return;
    try {
      await deleteProject(id);
      setProjects((p) => p.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

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
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total > 0 ? `${total} project${total !== 1 ? "s" : ""}` : "No projects yet"} — each project groups a JD with all applicants, AI runs, and reports.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

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
            <h2 className="text-lg font-semibold text-foreground">No projects yet</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Create your first project to start organizing job descriptions, resumes, and AI assessment runs.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
