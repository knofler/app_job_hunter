"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "critical" | "high" | "medium" | "low";
type BugStatus = "reported" | "triaged" | "working" | "solved" | "deployed" | "closed" | "rejected";

interface BugReport {
  _id: string;
  title: string;
  description: string;
  severity: Severity;
  status: BugStatus;
  stepsToReproduce?: string;
  steps_to_reproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  reporter: "user" | "ai";
  userId?: { name?: string; email?: string } | string;
  aiAnalysis?: string;
  resolution?: string;
  rejection_reason?: string;
  screenshots?: string[];
  prLink?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: "Critical", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  high: { label: "High", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  medium: { label: "Medium", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  low: { label: "Low", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
};

const STATUS_CONFIG: Record<BugStatus, { label: string; bg: string; text: string; border: string }> = {
  reported: { label: "Reported", bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30" },
  triaged: { label: "Triaged", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  working: { label: "Working", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  solved: { label: "Solved", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  deployed: { label: "Deployed", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  closed: { label: "Closed", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  rejected: { label: "Rejected", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

const STATUS_TABS: Array<{ value: BugStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "reported", label: "Reported" },
  { value: "working", label: "Working" },
  { value: "solved", label: "Solved" },
  { value: "deployed", label: "Deployed" },
  { value: "closed", label: "Closed" },
];

// ---------------------------------------------------------------------------
// Toast Component
// ---------------------------------------------------------------------------

function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg transition-all animate-slide-in ${
      type === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        : "border-red-500/30 bg-red-500/10 text-red-400"
    }`}>
      {type === "success" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
      <button onClick={onDismiss} className="ml-2 text-current opacity-60 hover:opacity-100">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BugReportsPage() {
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // List state
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BugStatus | "all">("all");
  const [sortMode, setSortMode] = useState<"newest" | "severity">("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSeverity, setEditSeverity] = useState<Severity>("medium");
  const [editSteps, setEditSteps] = useState("");
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchBugs = useCallback(async () => {
    try {
      const res = await fetch("/api/connect/bugs", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBugs(data.items || data.data || data.bugs || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  // ---------------------------------------------------------------------------
  // Form Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/connect/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          steps_to_reproduce: stepsToReproduce.trim() || undefined,
          expectedBehavior: expectedBehavior.trim() || undefined,
          actualBehavior: actualBehavior.trim() || undefined,
          screenshots: screenshots.length > 0 ? screenshots : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit bug report");
      }

      setToast({ message: "Bug report submitted successfully", type: "success" });
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setActualBehavior("");
      setScreenshots([]);
      setFormOpen(false);
      setLoading(true);
      fetchBugs();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to submit bug report",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit + Withdraw
  // ---------------------------------------------------------------------------

  const startEditing = (bug: BugReport) => {
    setEditingId(bug._id);
    setEditTitle(bug.title);
    setEditDescription(bug.description);
    setEditSeverity(bug.severity);
    setEditSteps(bug.stepsToReproduce || bug.steps_to_reproduce || "");
  };

  const handleSaveEdit = async (bugId: string) => {
    if (!editTitle.trim() || !editDescription.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/connect/bugs/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          severity: editSeverity,
          steps_to_reproduce: editSteps.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update bug report");
      setToast({ message: "Bug report updated", type: "success" });
      setEditingId(null);
      setLoading(true);
      fetchBugs();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to update", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (bugId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/connect/bugs/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "rejected", rejection_reason: "Withdrawn by reporter" }),
      });
      if (!res.ok) throw new Error("Failed to withdraw bug report");
      setToast({ message: "Bug report withdrawn", type: "success" });
      setLoading(true);
      fetchBugs();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to withdraw", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (bugId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/connect/bugs/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "closed" }),
      });
      if (!res.ok) throw new Error("Failed to close bug report");
      setToast({ message: "Bug report closed — confirmed fixed", type: "success" });
      setLoading(true);
      fetchBugs();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to close", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Convert to Feature
  // ---------------------------------------------------------------------------

  const handleConvertToFeature = async (bugId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/connect/bugs/${bugId}/convert-to-feature`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to convert bug to feature");
      }
      setToast({ message: "Bug converted to feature request", type: "success" });
      setLoading(true);
      fetchBugs();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to convert", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered + Sorted bugs
  // ---------------------------------------------------------------------------

  const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const filteredBugs = (statusFilter === "all"
    ? bugs
    : bugs.filter((b) => b.status === statusFilter)
  ).sort((a, b) => {
    if (sortMode === "severity") return (SEVERITY_RANK[a.severity] ?? 2) - (SEVERITY_RANK[b.severity] ?? 2);
    return new Date(b.created_at || b.createdAt || "").getTime() - new Date(a.created_at || a.createdAt || "").getTime();
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Breadcrumb + Header */}
      <div>
        <Link href="/connect" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Connect Hub
        </Link>
        <span className="mx-2 text-zinc-600">/</span>
        <span className="text-sm text-zinc-300">Bug Reports</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Bug Reports</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Report issues and track their resolution
          </p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          {formOpen ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Report a Bug
            </>
          )}
        </button>
      </div>

      {/* ================================================================= */}
      {/* Report Form (Collapsible)                                         */}
      {/* ================================================================= */}
      {formOpen && (
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-100">Report a Bug</h2>
            <p className="mt-1 text-sm text-zinc-500">Describe the issue you encountered</p>
          </div>

          <div className="space-y-5 p-6">
            {/* Title */}
            <div>
              <label htmlFor="bug-title" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="bug-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the bug"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="bug-desc" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="bug-desc"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Include as much detail as possible."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Severity</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev];
                  const isActive = severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steps to reproduce */}
            <div>
              <label htmlFor="bug-steps" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Steps to Reproduce <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                id="bug-steps"
                rows={3}
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y"
              />
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bug-expected" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Expected Behavior <span className="text-zinc-500">(optional)</span>
                </label>
                <textarea
                  id="bug-expected"
                  rows={3}
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What should have happened?"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y"
                />
              </div>
              <div>
                <label htmlFor="bug-actual" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Actual Behavior <span className="text-zinc-500">(optional)</span>
                </label>
                <textarea
                  id="bug-actual"
                  rows={3}
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually happened?"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y"
                />
              </div>
            </div>

            {/* Screenshots Drop Zone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Screenshots <span className="text-zinc-500">(optional — drag & drop or click)</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  screenshots.length > 0 ? "border-violet-500/30 bg-violet-500/5" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
                onClick={() => document.getElementById("bug-screenshot-input")?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setScreenshots(prev => [...prev, reader.result as string]);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                }}
              >
                {screenshots.length === 0 ? (
                  <p className="text-xs text-zinc-500">Drop images here or <span className="text-violet-400">browse</span></p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {screenshots.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt={`Screenshot ${i + 1}`} className="h-16 w-auto rounded border border-zinc-700" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setScreenshots(prev => prev.filter((_, j) => j !== i)); }}
                          className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          x
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center text-xs text-zinc-500">+ more</div>
                  </div>
                )}
              </div>
              <input
                id="bug-screenshot-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setScreenshots(prev => [...prev, reader.result as string]);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                  e.target.value = "";
                }}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="mr-3 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !description.trim()}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Bug Report"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ================================================================= */}
      {/* Bug List                                                          */}
      {/* ================================================================= */}

      {/* Filter + Sort Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-800 pb-px">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "border-b-2 border-violet-500 text-violet-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
          <button
            onClick={() => setSortMode("newest")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              sortMode === "newest"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortMode("severity")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              sortMode === "severity"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Severity
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start justify-between">
                <div className="h-5 w-48 rounded bg-zinc-800" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-zinc-800" />
                  <div className="h-5 w-16 rounded-full bg-zinc-800" />
                </div>
              </div>
              <div className="mt-3 h-3 w-3/4 rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBugs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
            <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-zinc-300">
            {statusFilter === "all" ? "No bugs reported yet" : `No ${statusFilter} bugs`}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {statusFilter === "all"
              ? "That's a good sign! Click \"Report a Bug\" if you find one."
              : "Try a different filter to see other bugs."}
          </p>
        </div>
      )}

      {/* Bug Cards */}
      {!loading && filteredBugs.length > 0 && (
        <div className="space-y-3">
          {filteredBugs.map((bug) => {
            const sevCfg = SEVERITY_CONFIG[bug.severity] || SEVERITY_CONFIG.medium;
            const statusCfg = STATUS_CONFIG[bug.status] || STATUS_CONFIG.reported;
            const isExpanded = expandedId === bug._id;

            return (
              <div key={bug._id} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : bug._id)}
                  className="w-full px-5 py-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">
                        {bug.title}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500 truncate">
                        {bug.description}
                      </p>
                      {bug.status === "rejected" && bug.rejection_reason && (
                        <p className="mt-1 text-xs italic text-red-400/70 truncate">
                          Reason: {bug.rejection_reason}
                        </p>
                      )}
                      {bug.status === "deployed" && bug.resolution && (
                        <p className="mt-1 text-xs italic text-emerald-400/70 truncate">
                          {bug.resolution}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Severity badge */}
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${sevCfg.bg} ${sevCfg.text} ${sevCfg.border}`}>
                        {sevCfg.label}
                      </span>
                      {/* Status badge */}
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{(() => { const d = new Date(bug.created_at || bug.createdAt || ""); return isNaN(d.getTime()) ? "" : d.toLocaleDateString(); })()}</span>
                    <span className="inline-flex items-center gap-1">
                      {bug.reporter === "ai" ? (
                        <>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          AI
                        </>
                      ) : (bug.userId as { name?: string })?.name || "User"}
                    </span>
                    {/* Expand chevron */}
                    <svg className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
                    {/* Confirm Fixed button (for deployed bugs) */}
                    {bug.status === "deployed" && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClose(bug._id); }}
                          disabled={saving}
                          className="flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Confirm Fixed — Close Case
                        </button>
                      </div>
                    )}

                    {/* Convert to Feature (for rejected bugs) */}
                    {bug.status === "rejected" && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleConvertToFeature(bug._id); }}
                          disabled={saving}
                          className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          Convert to Feature Request
                        </button>
                      </div>
                    )}

                    {/* Edit / Withdraw buttons (only for reported bugs) */}
                    {bug.status === "reported" && editingId !== bug._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(bug); }}
                          className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleWithdraw(bug._id); }}
                          disabled={saving}
                          className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Withdraw
                        </button>
                      </div>
                    )}

                    {/* Edit form */}
                    {editingId === bug._id && (
                      <div className="space-y-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-400">Title</label>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-400">Description</label>
                          <textarea
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none resize-y"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-400">Severity</label>
                          <div className="flex gap-2">
                            {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => {
                              const cfg = SEVERITY_CONFIG[sev];
                              return (
                                <button
                                  key={sev}
                                  type="button"
                                  onClick={() => setEditSeverity(sev)}
                                  className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                                    editSeverity === sev
                                      ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                                  }`}
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-400">Steps to Reproduce</label>
                          <textarea
                            rows={2}
                            value={editSteps}
                            onChange={(e) => setEditSteps(e.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none resize-y"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(bug._id)}
                            disabled={saving || !editTitle.trim() || !editDescription.trim()}
                            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Full description */}
                    {editingId !== bug._id && (
                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Description</h4>
                      <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{bug.description}</p>
                    </div>
                    )}

                    {(bug.stepsToReproduce || bug.steps_to_reproduce) && editingId !== bug._id && (
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Steps to Reproduce</h4>
                        <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{bug.stepsToReproduce || bug.steps_to_reproduce}</p>
                      </div>
                    )}

                    {(bug.expectedBehavior || bug.actualBehavior) && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {bug.expectedBehavior && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Expected Behavior</h4>
                            <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{bug.expectedBehavior}</p>
                          </div>
                        )}
                        {bug.actualBehavior && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Actual Behavior</h4>
                            <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{bug.actualBehavior}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {bug.aiAnalysis && (
                      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-violet-400">AI Analysis</h4>
                        <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{bug.aiAnalysis}</p>
                      </div>
                    )}

                    {bug.screenshots && bug.screenshots.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Screenshots</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {bug.screenshots.map((src, i) => (
                            <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                              <img src={src} alt={`Screenshot ${i + 1}`} className="h-32 w-auto rounded border border-zinc-700 hover:border-violet-500 transition-colors cursor-zoom-in" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {bug.resolution && (
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Resolution</h4>
                        <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{bug.resolution}</p>
                      </div>
                    )}

                    {bug.prLink && (
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Pull Request</h4>
                        <a
                          href={bug.prLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          {bug.prLink}
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
